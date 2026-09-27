import { AppError } from "../utilities/AppError.js";

export const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("admin access only", 403));
  }

  next();
};
