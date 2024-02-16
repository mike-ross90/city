import mongoose from "mongoose";
import { compile } from "morgan";

const RideSchema = mongoose.Schema(
  {
    from: {
      address: {
        type: String,
        required: false,
      },
      lat: {
        type: Number,
        required: false,
      },
      long: {
        type: Number,
        required: false,
      },
    },
    destination: {
      address: {
        type: String,
        required: false,
      },
      lat: {
        type: Number,
        required: false,
      },
      long: {
        type: Number,
        required: false,
      },
    },
    // type: {
    //   type: String,
    //   enum: ["ride", "chaperoneride"],
    //   required: true,
    // },
    // additionalDetails: {
    //   type: String,
    //   required: true,
    // },
    pre_aboutToday: {
      type: String,
      required: false,
    },
    pre_preferredPlace: {
      type: String,
      required: false,
    },
    pre_time: {
      type: String,
      required: false,
    },
    pre_date: {
      type: String,
      required: false,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    status: {
      type: String,
      enum: [
        "accepted",
        "pending",
        "completed",
        "cancelled",
        "rejected",
        "arrived",
        "started",
      ],
      default: "pending",
      required: true,
    },
    estFare: {
      type: String,
      required: false,
    },
    distance: {
      type: String,
      required: false,
    },
    rejectedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "auth",
      },
    ],
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    rideStartTime: {
      type: String,
    },
    rideEndTime: {
      type: String,
    },
    waitTime: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: false,
        default: "Point",
      },
      coordinates: {
        type: [Number], // Change to Number data type
        required: false,
        // default:[ 95.7129 , 37.0902]
      },
    },
    havePaid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);
RideSchema.index({ coordinates: "2dsphere" });
const RideModel = mongoose.model("Ride", RideSchema);
export default RideModel;
