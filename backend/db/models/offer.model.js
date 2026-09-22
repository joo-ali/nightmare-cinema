import { model, Schema } from "mongoose";

const offerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: ""
    },
    image: {
      type: String,
      trim: true,
      default: ""
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage"
    },
    discountValue: {
      type: Number,
      min: 0,
      default: 0
    },
    validDates: {
      type: [String],
      default: []
    },
    applicableMovies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Movie"
      }
    ],
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

offerSchema.index({ active: 1 });
offerSchema.index({ validDates: 1 });
offerSchema.index({ applicableMovies: 1 });
offerSchema.index({ code: 1 });

export const offerModel = model("Offer", offerSchema);
