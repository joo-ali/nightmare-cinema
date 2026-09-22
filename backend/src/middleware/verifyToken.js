import jwt from "jsonwebtoken";
import { userModel } from "../../db/models/user.model.js";
import { AppError } from "../utilities/AppError.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return next(new AppError("token is required", 401));
    }

    const [type, token] = authorization.split(" ");

    if (type !== "Bearer" || !token) {
      return next(new AppError("invalid token", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded.id)
      .select("passwordChangedAt role");

    if (!user) {
      return next(new AppError("user not found", 401));
    }

    if (
      user.passwordChangedAt &&
      decoded.iat * 1000 < user.passwordChangedAt.getTime()
    ) {
      return next(
        new AppError("session expired, please login again", 401)
      );
    }

    req.user = {
      ...decoded,
      role: user.role
    };

    next();
  } catch (error) {
    next(new AppError("invalid or expired token", 401));
  }
};
