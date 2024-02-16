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
  },
  {
    timestamps: true,
  }
);

// Driver.index({ coordinates: "2dsphere" });
const driverModel = mongoose.model("driver", Driver);
export default driverModel;
