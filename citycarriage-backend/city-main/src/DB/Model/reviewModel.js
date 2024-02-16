import mongoose from "mongoose";

const reviewSchema = mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Ride",
    },
    rating: {
      type: mongoose.Schema.Types.Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const reviewModel = mongoose.model("review", reviewSchema);

export default reviewModel;
