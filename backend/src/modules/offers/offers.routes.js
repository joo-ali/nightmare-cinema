import express from "express";
import {
  getOffers,
  validateOffer,
  getAllOffers,
  addOffer,
  updateOffer,
  deleteOffer
} from "./offers.controller.js";
import { verifyToken } from "../../middleware/verifyToken.js";
import { adminAuth } from "../../middleware/adminAuth.js";

export const offerRoutes = express.Router();

offerRoutes.get("/offers", getOffers);
offerRoutes.post("/offers/validate", validateOffer);
offerRoutes.get("/admin/offers", verifyToken, adminAuth, getAllOffers);
offerRoutes.post("/offers", verifyToken, adminAuth, addOffer);
offerRoutes.put("/offers/:id", verifyToken, adminAuth, updateOffer);
offerRoutes.delete("/offers/:id", verifyToken, adminAuth, deleteOffer);
