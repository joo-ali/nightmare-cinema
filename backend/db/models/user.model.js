import { model, Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    isConfirmed: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user"
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false
    },
    passwordChangedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const userModel = model("User", userSchema);
