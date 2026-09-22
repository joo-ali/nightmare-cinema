import bcrypt from "bcrypt";
import {
  createHash,
  randomBytes
} from "crypto";
import { userModel } from "../../../db/models/user.model.js";
import { sendEmail } from "../../utilities/email.js";
import { resetPasswordEmailTemplate } from "../../utilities/resetPasswordEmailTemplate.js";
import { AppError } from "../../utilities/AppError.js";

export const forgotPassword = async (req, res, next) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return next(new AppError("email is required", 400));
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        message:
          "If this email exists, a password reset link has been sent."
      });
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save({
      validateBeforeSave: false
    });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://127.0.0.1:5500";

    const resetLink =
      `${frontendUrl}/reset-password.html?token=${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your Nightmare Cinema password",
        html: resetPasswordEmailTemplate(
          resetLink,
          user.name
        )
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save({
        validateBeforeSave: false
      });

      return next(
        new AppError("could not send reset email", 500)
      );
    }

    res.json({
      message:
        "If this email exists, a password reset link has been sent."
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const token = String(req.params.token || "").trim();
    const password = String(req.body.password || "");

    if (!token || !password) {
      return next(
        new AppError("token and password are required", 400)
      );
    }

    if (password.length < 6) {
      return next(
        new AppError(
          "password must be at least 6 characters",
          400
        )
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await userModel
      .findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: {
          $gt: new Date()
        }
      })
      .select(
        "+resetPasswordToken +resetPasswordExpires"
      );

    if (!user) {
      return next(
        new AppError(
          "invalid or expired reset link",
          400
        )
      );
    }

    user.password = await bcrypt.hash(password, 8);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      message: "password reset successfully"
    });
  } catch (error) {
    next(error);
  }
};
