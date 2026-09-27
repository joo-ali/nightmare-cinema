import express from "express";
import {
  forgotPassword,
  resetPassword
} from "./password.controller.js";

export const passwordRoutes = express.Router();

passwordRoutes.post("/auth/forgot-password", forgotPassword);
passwordRoutes.post("/auth/reset-password/:token", resetPassword);
