import mongoose from "mongoose";

const RideSchema = mongoose.Schema(
  {
    // mode: {
    //   type: mongoose.Schema.Types.String,
    //   enum: ["pre", "instant"],
    //   required: true,
    // },
    // type: {
    //   type: String,
    //   enum: ["ride", "chaperoneride"],
    //   required: true,
    // },
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
    additionalDetails: {
      type: String,
      required: true,
    },
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
    arrivalTime: {
      type: String,
    },
    waitingTime: {
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
RideSchema.index({ location: "2dsphere" });
const RideModel = mongoose.model("Ride", RideSchema);
export default RideModel;
