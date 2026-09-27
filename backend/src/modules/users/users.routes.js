import express from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import {
  register,
  verifyEmail,
  login,
  getProfile
} from "./users.controller.js";

export const userRoutes = express.Router();

userRoutes.post("/auth/register", register);
userRoutes.post("/auth/login", login);
userRoutes.get("/auth/verify/:token", verifyEmail);
userRoutes.get("/auth/me", verifyToken, getProfile);
