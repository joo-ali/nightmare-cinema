import mongoose from "mongoose";
import { showtimeModel } from "../../../db/models/showtime.model.js";
import { movieModel } from "../../../db/models/movie.model.js";
import { screenModel } from "../../../db/models/screen.model.js";
import { bookingModel } from "../../../db/models/booking.model.js";
import { AppError } from "../../utilities/AppError.js";

export const addShowtime = async (req, res, next) => {
  try {
    const {
      movie,
      screen,
      startTime,
      price,
      format
    } = req.body;

    if (
      !movie ||
      !screen ||
      !startTime ||
      price === undefined ||
      price === null
    ) {
      return next(
        new AppError(
          "movie, screen, startTime and price are required",
          400
        )
      );
    }

    if (
      !mongoose.isValidObjectId(movie) ||
      !mongoose.isValidObjectId(screen)
    ) {
      return next(
        new AppError(
          "invalid movie or screen id",
          400
        )
      );
    }

    const parsedPrice = Number(price);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return next(new AppError("invalid price", 400));
    }

    const parsedStartTime = new Date(startTime);

    if (Number.isNaN(parsedStartTime.getTime())) {
      return next(new AppError("invalid start time", 400));
    }

    if (parsedStartTime <= new Date()) {
      return next(
        new AppError("showtime must be in the future", 400)
      );
    }

    const movieExists = await movieModel.findById(movie);

    if (!movieExists) {
      return next(new AppError("movie not found", 404));
    }

    const screenExists = await screenModel.findById(screen);

    if (!screenExists) {
      return next(new AppError("screen not found", 404));
    }

    const existingShowtime = await showtimeModel.findOne({
      screen,
      startTime: parsedStartTime
    });

    if (existingShowtime) {
      return next(
        new AppError(
          "this screen already has a showtime at the same time",
          409
        )
      );
    }

    const showtime = await showtimeModel.create({
      movie,
      screen,
      startTime: parsedStartTime,
      price: parsedPrice,
      format
    });

    await showtime.populate([
      {
        path: "movie",
        select: "title poster duration ageRating"
      },
      {
        path: "screen",
        select:
          "name experience rows seatsPerRow cinema"
      }
    ]);

    res.status(201).json({
      message: "showtime added successfully",
      showtime
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtimes = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.movie) {
      if (!mongoose.isValidObjectId(req.query.movie)) {
        return next(new AppError("invalid movie id", 400));
      }

      filter.movie = req.query.movie;
    }

    const showtimes = await showtimeModel
      .find(filter)
      .populate(
        "movie",
        "title poster duration ageRating"
      )
      .populate(
        "screen",
        "name experience rows seatsPerRow cinema"
      )
      .sort({
        startTime: 1
      });

    res.json({
      message: "showtimes retrieved successfully",
      showtimes
    });
  } catch (error) {
    next(error);
  }
};

export const getShowtimeSeats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(
        new AppError("invalid showtime id", 400)
      );
    }

    const showtime = await showtimeModel
      .findById(id)
      .populate(
        "screen",
        "name experience rows seatsPerRow cinema"
      );

    if (!showtime) {
      return next(new AppError("showtime not found", 404));
    }

    res.json({
      screen: showtime.screen,
      bookedSeats: showtime.bookedSeats
    });
  } catch (error) {
    next(error);
  }
};

export const deleteShowtime = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(
        new AppError("invalid showtime id", 400)
      );
    }

    const showtime = await showtimeModel.findById(id);

    if (!showtime) {
      return next(new AppError("showtime not found", 404));
    }

    const confirmedBooking = await bookingModel.exists({
      showtime: id,
      status: "confirmed"
    });

    if (confirmedBooking) {
      return next(
        new AppError(
          "cannot delete a showtime that has confirmed bookings",
          409
        )
      );
    }

    await showtimeModel.findByIdAndDelete(id);

    res.json({
      message: "showtime deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
