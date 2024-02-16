import mongoose from "mongoose";

const Driver = mongoose.Schema(
  {
    isApproved: {
      type: Boolean,
      required: false,
      default: true,
    },
    isOnline: {
      type: Boolean,
      required: false,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    vehicleName: {
      type: String,
      required: false,
    },
    vehicleNo: {
      type: String,
      required: false,
    },
    status: {
      enum: ["inRide", "idle"],
      type: String,
      required: false,
    },
    experience: {
      type: String,
      required: false,
    },
    licenceNumber: {
      type: String,
      required: false,
    },
    licenceExpiry: {
      type: String,
      required: false,
    },
    hourlyFare: {
      type: String,
      default: "0",
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    idCardPictureUrl: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
    },
    // drivingLicense: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: false,
    //   ref: "fileUpload",
    // },
    rating: {
      type: Number,
      required: false,
      default: 0,
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
      },
    },
    rejectedRides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "ride",
      },
    ],
    acceptedRides: [
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

// Driver.index({ coordinates: "2dsphere" });
const driverModel = mongoose.model("driver", Driver);
export default driverModel;
