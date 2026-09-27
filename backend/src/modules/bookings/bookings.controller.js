import mongoose from "mongoose";
import { randomBytes } from "crypto";

import { bookingModel } from "../../../db/models/booking.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";

import { AppError } from "../../utilities/AppError.js";
import { cleanupExpiredPayments } from "../payments/payment.cleanup.js";


function generateBookingCode() {
  return `NM-${randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}


function getScreenSeats(
  rows,
  seatsPerRow
) {
  const seats = [];

  for (
    let rowIndex = 0;
    rowIndex < rows;
    rowIndex++
  ) {
    const rowName =
      String.fromCharCode(
        65 + rowIndex
      );

    for (
      let seatNumber = 1;
      seatNumber <= seatsPerRow;
      seatNumber++
    ) {
      seats.push(
        `${rowName}${seatNumber}`
      );
    }
  }

  return seats;
}


export const createBooking = async (
  req,
  res,
  next
) => {
  try {
    const {
      showtime,
      seats
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


    if (
      !mongoose.isValidObjectId(
        showtime
      )
    ) {
      return next(
        new AppError(
          "invalid showtime id",
          400
        )
      );
    }


    await cleanupExpiredPayments(
      showtime
    );


    const selectedSeats =
      seats.map((seat) =>
        String(seat)
          .trim()
          .toUpperCase()
      );


    const uniqueSeats = [
      ...new Set(selectedSeats)
    ];


    if (
      uniqueSeats.length !==
      selectedSeats.length
    ) {
      return next(
        new AppError(
          "duplicate seats are not allowed",
          400
        )
      );
    }


    const showtimeData =
      await showtimeModel
        .findById(showtime)
        .populate("screen");


    if (!showtimeData) {
      return next(
        new AppError(
          "showtime not found",
          404
        )
      );
    }


    if (
      showtimeData.status !==
      "scheduled"
    ) {
      return next(
        new AppError(
          "showtime is not available",
          400
        )
      );
    }


    if (
      showtimeData.startTime <=
      new Date()
    ) {
      return next(
        new AppError(
          "showtime has already started",
          400
        )
      );
    }


    if (!showtimeData.screen) {
      return next(
        new AppError(
          "screen not found",
          404
        )
      );
    }


    const validSeats =
      getScreenSeats(
        showtimeData.screen.rows,
        showtimeData.screen
          .seatsPerRow
      );


    const invalidSeat =
      selectedSeats.find(
        (seat) =>
          !validSeats.includes(
            seat
          )
      );


    if (invalidSeat) {
      return next(
        new AppError(
          `invalid seat ${invalidSeat}`,
          400
        )
      );
    }


    const subtotal =
      showtimeData.price *
      selectedSeats.length;


    const totalPrice =
      subtotal;


    const updatedShowtime =
      await showtimeModel
        .findOneAndUpdate(
          {
            _id: showtime,

            status:
              "scheduled",

            bookedSeats: {
              $nin:
                selectedSeats
            }
          },

          {
            $addToSet: {
              bookedSeats: {
                $each:
                  selectedSeats
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
      booking =
        await bookingModel.create({
          user:
            req.user.id,

          showtime,

          seats:
            selectedSeats,

          ticketPrice:
            showtimeData.price,

          subtotal,

          totalPrice,

          bookingCode:
            generateBookingCode(),

          status:
            "pending_payment",

          paymentStatus:
            "pending",

          paymentExpiresAt:
            new Date(
              Date.now() +
                15 * 60 * 1000
            )
        });

    } catch (error) {

      await showtimeModel
        .findByIdAndUpdate(
          showtime,
          {
            $pull: {
              bookedSeats: {
                $in:
                  selectedSeats
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
            select:
              "title poster"
          },
          {
            path: "screen",
            select:
              "name experience cinema"
          }
        ]
      }
    ]);


    res.status(201).json({
      message:
        "booking created, payment required",

      booking
    });

  } catch (error) {
    next(error);
  }
};


export const getMyBookings =
  async (
    req,
    res,
    next
  ) => {
    try {
      const bookings =
        await bookingModel
          .find({
            user:
              req.user.id
          })
          .populate({
            path: "showtime",

            populate: [
              {
                path: "movie",
                select:
                  "title poster"
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
        message:
          "my bookings",

        bookings
      });

    } catch (error) {
      next(error);
    }
  };


export const cancelBooking =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;


      if (
        !mongoose.isValidObjectId(
          id
        )
      ) {
        return next(
          new AppError(
            "invalid booking id",
            400
          )
        );
      }


      const booking =
        await bookingModel.findOne({
          _id: id,
          user: req.user.id
        });


      if (!booking) {
        return next(
          new AppError(
            "booking not found",
            404
          )
        );
      }


      if (
        booking.status ===
        "cancelled"
      ) {
        return next(
          new AppError(
            "booking already cancelled",
            400
          )
        );
      }


      const previousStatus =
        booking.status;

      const previousPaymentStatus =
        booking.paymentStatus;


      booking.status =
        "cancelled";


      if (
        booking.paymentStatus ===
        "pending"
      ) {
        booking.paymentStatus =
          "failed";
      }


      await booking.save();


      try {
        await showtimeModel
          .findByIdAndUpdate(
            booking.showtime,
            {
              $pull: {
                bookedSeats: {
                  $in:
                    booking.seats
                }
              }
            }
          );

      } catch (error) {

        booking.status =
          previousStatus;

        booking.paymentStatus =
          previousPaymentStatus;

        await booking.save();

        throw error;
      }


      res.json({
        message:
          "booking cancelled successfully"
      });

    } catch (error) {
      next(error);
    }
  };


export const getAllBookings =
  async (
    req,
    res,
    next
  ) => {
    try {
      const bookings =
        await bookingModel
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
                select:
                  "title poster"
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
        message:
          "all bookings",

        bookings
      });

    } catch (error) {
      next(error);
    }
  };