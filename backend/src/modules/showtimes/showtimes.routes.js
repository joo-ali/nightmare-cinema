import express from "express";
import {
  addShowtime,
  getShowtimes,
  getShowtimeSeats,
  deleteShowtime
} from "./showtimes.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { adminAuth } from "../../middleware/adminAuth.js";

export const showtimeRoutes = express.Router();

showtimeRoutes.get("/showtimes", getShowtimes);
showtimeRoutes.get("/showtimes/:id/seats", getShowtimeSeats);
showtimeRoutes.post("/showtimes", verifyToken, adminAuth, addShowtime);
showtimeRoutes.delete("/showtimes/:id", verifyToken, adminAuth, deleteShowtime);
