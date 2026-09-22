import { model, Schema } from "mongoose";

const screenSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: String,
      enum: ["Standard", "MAX", "GOLD", "4DX"],
      required: true
    },
    rows: {
      type: Number,
      required: true,
      min: 1
    },
    seatsPerRow: {
      type: Number,
      required: true,
      min: 1
    },
    cinema: {
      type: String,
      default: "Royal Mall"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const screenModel = model("Screen", screenSchema);
