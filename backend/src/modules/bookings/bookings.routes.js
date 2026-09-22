import express from "express";
import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAllBookings
} from "./bookings.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { adminAuth } from "../../middleware/adminAuth.js";

export const bookingRoutes = express.Router();

bookingRoutes.post("/bookings", verifyToken, createBooking);
bookingRoutes.get("/bookings/my", verifyToken, getMyBookings);
bookingRoutes.patch("/bookings/:id/cancel", verifyToken, cancelBooking);
bookingRoutes.get("/admin/bookings", verifyToken, adminAuth, getAllBookings);
