import express from "express";

import {
  createPaymentSession,
  verifyPayment,
  kashierWebhook
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


paymentRoutes.post(
  "/payments/kashier-webhook",
  kashierWebhook
);