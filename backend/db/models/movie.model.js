import { model, Schema } from "mongoose";

const movieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    poster: {
      type: String,
      required: true
    },
    backdrop: {
      type: String
    },
    trailer: {
      type: String
    },
    genre: {
      type: [String],
      default: []
    },
    language: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    ageRating: {
      type: String
    },
    releaseDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ["now_showing", "coming_soon"],
      default: "now_showing"
    },
    rating: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const movieModel = model("Movie", movieSchema);
