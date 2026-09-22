import mongoose from "mongoose";
import { movieModel } from "../../../db/models/movie.model.js";
import { showtimeModel } from "../../../db/models/showtime.model.js";
import { AppError } from "../../utilities/AppError.js";

export const getMovies = async (req, res, next) => {
  try {
    const movies = await movieModel.find();

    res.json({
      message: "all movies",
      movies
    });
  } catch (error) {
    next(error);
  }
};

export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError("invalid movie id", 400));
    }

    const movie = await movieModel.findById(id);

    if (!movie) {
      return next(new AppError("movie not found", 404));
    }

    res.json({
      message: "movie found",
      movie
    });
  } catch (error) {
    next(error);
  }
};

export const addMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      poster,
      backdrop,
      trailer,
      genre,
      language,
      duration,
      ageRating,
      releaseDate,
      status,
      rating
    } = req.body;

    if (!title || !description || !poster || !language || !duration) {
      return next(new AppError("required movie data is missing", 400));
    }

    const movie = await movieModel.create({
      title,
      description,
      poster,
      backdrop,
      trailer,
      genre,
      language,
      duration,
      ageRating,
      releaseDate,
      status,
      rating
    });

    res.status(201).json({
      message: "movie added successfully",
      movie
    });
  } catch (error) {
    next(error);
  }
};

export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError("invalid movie id", 400));
    }

    const movie = await movieModel.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!movie) {
      return next(new AppError("movie not found", 404));
    }

    res.json({
      message: "movie updated successfully",
      movie
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return next(new AppError("invalid movie id", 400));
    }

    const movie = await movieModel.findById(id);

    if (!movie) {
      return next(new AppError("movie not found", 404));
    }

    const linkedShowtime = await showtimeModel.exists({
      movie: id
    });

    if (linkedShowtime) {
      return next(
        new AppError(
          "cannot delete a movie that has showtimes",
          409
        )
      );
    }

    await movieModel.findByIdAndDelete(id);

    res.json({
      message: "movie deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
