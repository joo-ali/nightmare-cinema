import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userModel } from "../../../db/models/user.model.js";
import { AppError } from "../../utilities/AppError.js";
import { sendEmail } from "../../utilities/email.js";
import { verificationEmailTemplate } from "../../utilities/emailTemplate.js";


export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(
        new AppError("name, email and password are required", 400)
      );
    }

    const exists = await userModel.findOne({
      email: email.toLowerCase()
    });

    if (exists) {
      return next(
        new AppError("user already exists, please login", 409)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const user = await userModel.create({
      name,
      email,
      password: hashedPassword
    });

    const emailToken = jwt.sign(
      { id: user._id },
      process.env.EMAIL_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    const verificationLink =
      `https://nightmare-cinema.vercel.app/auth/verify/${emailToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your Nightmare Cinema account",
      html: verificationEmailTemplate(
        verificationLink,
        user.name
      )
    });

    res.status(201).json({
      message: "user registered successfully, please verify your email",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const decoded = jwt.verify(
      token,
      process.env.EMAIL_TOKEN_SECRET
    );

    const user = await userModel.findById(
      decoded.id
    );

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth.html?verified=0`
      );
    }

    user.isConfirmed = true;
    await user.save();

    return res.redirect(
      `${process.env.FRONTEND_URL}/auth.html?verified=1`
    );
  } catch (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/auth.html?verified=0`
    );
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(
        new AppError("email and password are required", 400)
      );
    }

    const user = await userModel.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return next(
        new AppError("email or password is incorrect", 401)
      );
    }

    const matched = await bcrypt.compare(
      password,
      user.password
    );

    if (!matched) {
      return next(
        new AppError("email or password is incorrect", 401)
      );
    }

    if (!user.isConfirmed) {
      return next(
        new AppError("please confirm your email first", 403)
      );
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    res.status(200).json({
      message: `welcome ${user.name}`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("-password");

    if (!user) {
      return next(new AppError("user not found", 404));
    }

    res.json({
      message: "user profile",
      user
    });
  } catch (error) {
    next(error);
  }
};
