import { model, Schema } from "mongoose";

const bookingSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    showtime: {
      type: Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
      index: true
    },
    seats: {
      type: [String],
      required: true
    },
    ticketPrice: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    totalPrice: {
      type: Number,
      required: true
    },
    bookingCode: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled"],
      default: "confirmed",
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

bookingSchema.index({
  user: 1,
  createdAt: -1
});

export const bookingModel = model("Booking", bookingSchema);
