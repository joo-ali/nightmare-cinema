import express from "express";
import {
  addScreen,
  getScreens
} from "./screens.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { adminAuth } from "../../middleware/adminAuth.js";

export const screenRoutes = express.Router();

screenRoutes.get("/screens", getScreens);
screenRoutes.post("/screens", verifyToken, adminAuth, addScreen);
