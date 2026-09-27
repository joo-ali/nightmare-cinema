import express from "express";

import {
  createPaymentSession,
  verifyPayment
} from "./payment.controller.js";

import {
  verifyToken
} from "../../middleware/verifyToken.js";


export const paymentRoutes =
  express.Router();


paymentRoutes.post(
  "/payments/create-session",
  verifyToken,
  createPaymentSession
);


paymentRoutes.get(
  "/payments/verify/:bookingId",
  verifyToken,
  verifyPayment
);