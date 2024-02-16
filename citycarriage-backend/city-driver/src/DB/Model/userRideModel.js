import mongoose from "mongoose";

const userRideSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [mongoose.Schema.Types.Number],
        required: false,
      },
    },
    rides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "ride",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userRideSchema.index({ location: "2dsphere" });
const userRideModel = mongoose.model("userRide", userRideSchema);
export default userRideModel;
