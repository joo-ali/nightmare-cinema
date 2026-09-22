import { model, Schema } from "mongoose";

const showtimeSchema = new Schema(
  {
    movie: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true
    },
    screen: {
      type: Schema.Types.ObjectId,
      ref: "Screen",
      required: true
    },
    startTime: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    format: {
      type: String,
      enum: ["2D", "3D"],
      default: "2D"
    },
    status: {
      type: String,
      enum: ["scheduled", "cancelled"],
      default: "scheduled"
    },
    cinema: {
      type: String,
      default: "Royal Mall"
    },
    bookedSeats: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

showtimeSchema.index(
  {
    screen: 1,
    startTime: 1
  },
  {
    unique: true
  }
);

export const showtimeModel = model("Showtime", showtimeSchema);
