import mongoose from "mongoose";
import { randomBytes } from "crypto";
import { bookingModel } from "../../../db/models/booking.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";
import { offerModel } from "../../../db/models/offer.model.js";
import { sendEmail } from "../../utilities/email.js";
import { bookingConfirmationEmailTemplate } from "../../utilities/bookingEmailTemplate.js";
import { AppError } from "../../utilities/AppError.js";

function getCinemaDateCode(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Africa/Cairo"
  }).formatToParts(new Date(date));

  const values = {};

  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function offerAppliesToMovie(offer, movieId) {
  if (
    !Array.isArray(offer.applicableMovies) ||
    offer.applicableMovies.length === 0
  ) {
    return true;
  }

  return offer.applicableMovies.some(
    (id) => String(id?._id || id) === String(movieId)
  );
}

function isOfferAvailableToday(offer) {
  return (
    Array.isArray(offer.validDates) &&
    offer.validDates.includes(getCinemaDateCode(new Date()))
  );
}

function generateBookingCode() {
  return `NM-${randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

function getScreenSeats(rows, seatsPerRow) {
  const seats = [];

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    const rowName = String.fromCharCode(65 + rowIndex);

    for (
      let seatNumber = 1;
      seatNumber <= seatsPerRow;
      seatNumber++
    ) {
      seats.push(`${rowName}${seatNumber}`);
    }
  }

  return seats;
}

function getDiscount(subtotal, offer) {
  if (!offer) {
    return 0;
  }

  if (offer.discountType === "percentage") {
    return Math.min(
      subtotal,
      Number(
        (
          subtotal *
          (offer.discountValue / 100)
        ).toFixed(2)
      )
    );
  }

  return Math.min(subtotal, offer.discountValue);
}

async function getValidOffer(promoCode, movieId) {
  const code = String(promoCode || "")
    .trim()
    .toUpperCase();

  if (!code) {
    return null;
  }

  const offer = await offerModel.findOne({
    code,
    active: true,
    discountValue: {
      $gt: 0
    }
  });

  if (!offer) {
    throw new AppError(
      "invalid or inactive promo code",
      400
    );
  }

  if (!isOfferAvailableToday(offer)) {
    throw new AppError(
      "promo code can only be used on its valid booking date",
      400
    );
  }

  if (!offerAppliesToMovie(offer, movieId)) {
    throw new AppError(
      "promo code is not valid for this movie",
      400
    );
  }

  return offer;
}

export const createBooking = async (req, res, next) => {
  try {
    const {
      showtime,
      seats,
      promoCode
    } = req.body;

    if (
      !showtime ||
      !Array.isArray(seats) ||
      seats.length === 0
    ) {
      return next(
        new AppError(
          "showtime and seats are required",
          400
        )
      );
    }

    if (!mongoose.isValidObjectId(showtime)) {
      return next(
        new AppError("invalid showtime id", 400)
      );
    }

    const selectedSeats = seats.map((seat) =>
      String(seat)
        .trim()
        .toUpperCase()
    );

    const uniqueSeats = [...new Set(selectedSeats)];

    if (uniqueSeats.length !== selectedSeats.length) {
      return next(
        new AppError(
          "duplicate seats are not allowed",
          400
        )
      );
    }

    const showtimeData = await showtimeModel
      .findById(showtime)
      .populate("screen");

    if (!showtimeData) {
      return next(
        new AppError("showtime not found", 404)
      );
    }

    if (showtimeData.status !== "scheduled") {
      return next(
        new AppError(
          "showtime is not available",
          400
        )
      );
    }

    if (showtimeData.startTime <= new Date()) {
      return next(
        new AppError(
          "showtime has already started",
          400
        )
      );
    }

    if (!showtimeData.screen) {
      return next(
        new AppError("screen not found", 404)
      );
    }

    const validSeats = getScreenSeats(
      showtimeData.screen.rows,
      showtimeData.screen.seatsPerRow
    );

    const invalidSeat = selectedSeats.find(
      (seat) => !validSeats.includes(seat)
    );

    if (invalidSeat) {
      return next(
        new AppError(
          `invalid seat ${invalidSeat}`,
          400
        )
      );
    }

    const offer = await getValidOffer(
      promoCode,
      showtimeData.movie
    );

    const subtotal =
      showtimeData.price *
      selectedSeats.length;

    const discountAmount =
      getDiscount(subtotal, offer);

    const totalPrice = Number(
      (subtotal - discountAmount).toFixed(2)
    );

    const updatedShowtime =
      await showtimeModel.findOneAndUpdate(
        {
          _id: showtime,
          status: "scheduled",
          bookedSeats: {
            $nin: selectedSeats
          }
        },
        {
          $addToSet: {
            bookedSeats: {
              $each: selectedSeats
            }
          }
        },
        {
          new: true
        }
      );

    if (!updatedShowtime) {
      return next(
        new AppError(
          "one or more seats are already booked",
          409
        )
      );
    }

    let booking;

    try {
      booking = await bookingModel.create({
        user: req.user.id,
        showtime,
        seats: selectedSeats,
        ticketPrice: showtimeData.price,
        subtotal,
        discountAmount,
        promoCode: offer ? offer.code : "",
        totalPrice,
        bookingCode: generateBookingCode()
      });
    } catch (error) {
      await showtimeModel.findByIdAndUpdate(
        showtime,
        {
          $pull: {
            bookedSeats: {
              $in: selectedSeats
            }
          }
        }
      );

      throw error;
    }

    await booking.populate([
      {
        path: "user",
        select: "name email"
      },
      {
        path: "showtime",
        populate: [
          {
            path: "movie",
            select: "title poster"
          },
          {
            path: "screen",
            select:
              "name experience cinema"
          }
        ]
      }
    ]);

    try {
      await sendEmail({
        to: booking.user.email,
        subject:
          `Nightmare Cinema Booking ${booking.bookingCode}`,
        html:
          bookingConfirmationEmailTemplate(booking)
      });
    } catch (emailError) {
      console.error(
        "booking confirmation email failed:",
        emailError.message
      );
    }

    res.status(201).json({
      message: "booking created successfully",
      booking
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingModel
      .find({
        user: req.user.id
      })
      .populate({
        path: "showtime",
        populate: [
          {
            path: "movie",
            select: "title poster"
          },
          {
            path: "screen",
            select:
              "name experience cinema"
          }
        ]
      })
      .sort({
        createdAt: -1
      });

    res.json({
      message: "my bookings",
      bookings
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(
        new AppError("invalid booking id", 400)
      );
    }

    const booking = await bookingModel.findOne({
      _id: id,
      user: req.user.id
    });

    if (!booking) {
      return next(
        new AppError("booking not found", 404)
      );
    }

    if (booking.status === "cancelled") {
      return next(
        new AppError(
          "booking already cancelled",
          400
        )
      );
    }

    booking.status = "cancelled";
    await booking.save();

    try {
      await showtimeModel.findByIdAndUpdate(
        booking.showtime,
        {
          $pull: {
            bookedSeats: {
              $in: booking.seats
            }
          }
        }
      );
    } catch (error) {
      booking.status = "confirmed";
      await booking.save();
      throw error;
    }

    res.json({
      message: "booking cancelled successfully"
    });
  } catch (error) {
    next(error);
  }
};

export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await bookingModel
      .find()
      .populate(
        "user",
        "name email"
      )
      .populate({
        path: "showtime",
        populate: [
          {
            path: "movie",
            select: "title poster"
          },
          {
            path: "screen",
            select:
              "name experience cinema"
          }
        ]
      })
      .sort({
        createdAt: -1
      });

    res.json({
      message: "all bookings",
      bookings
    });
  } catch (error) {
    next(error);
  }
};
