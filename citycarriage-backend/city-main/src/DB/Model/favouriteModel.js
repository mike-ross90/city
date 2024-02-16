import mongoose from "mongoose";

const favouriteSchema = mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "driver",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    isLiked: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const favouriteModel = mongoose.model("favourite", favouriteSchema);

export default favouriteModel;
