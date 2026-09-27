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
      enum: [
        "pending_payment",
        "confirmed",
        "cancelled"
      ],
      default: "pending_payment",
      index: true
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed"
      ],
      default: "pending",
      index: true
    },

    kashierSessionId: {
      type: String,
    },

    kashierSessionUrl: {
      type: String,
      default: null
    },

    paymentExpiresAt: {
      type: Date,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
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

bookingSchema.index(
  { kashierSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      kashierSessionId: {
        $type: "string"
      }
    }
  }
);

export const bookingModel = model("Booking", bookingSchema);
