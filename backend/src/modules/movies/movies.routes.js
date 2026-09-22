import express from "express";
import {
  getMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie
} from "./movies.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { adminAuth } from "../../middleware/adminAuth.js";

export const movieRoutes = express.Router();

movieRoutes.get("/movies", getMovies);
movieRoutes.get("/movies/:id", getMovieById);
movieRoutes.post("/movies", verifyToken, adminAuth, addMovie);
movieRoutes.put("/movies/:id", verifyToken, adminAuth, updateMovie);
movieRoutes.delete("/movies/:id", verifyToken, adminAuth, deleteMovie);
