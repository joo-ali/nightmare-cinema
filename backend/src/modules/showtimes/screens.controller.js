import { screenModel } from "../../../db/models/screen.model.js";
import { AppError } from "../../utilities/AppError.js";

export const addScreen = async (req, res, next) => {
  try {
    const {
      name,
      experience,
      rows,
      seatsPerRow
    } = req.body;

    if (!name || !experience || !rows || !seatsPerRow) {
      return next(new AppError("screen data is required", 400));
    }

    const screen = await screenModel.create({
      name,
      experience,
      rows,
      seatsPerRow
    });

    res.status(201).json({
      message: "screen added successfully",
      screen
    });
  } catch (error) {
    next(error);
  }
};

export const getScreens = async (req, res, next) => {
  try {
    const screens = await screenModel.find();

    res.json({
      message: "all screens",
      screens
    });
  } catch (error) {
    next(error);
  }
};
