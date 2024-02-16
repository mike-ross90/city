import mongoose from "mongoose";
import { hashPassword } from "../../Utils/SecuringPassword.js";

const Chaperone = mongoose.Schema(
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
    idCard: {
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
        type: [Number],
        required: false,
        default: [73.935242, 40.73061],
      },
    },
  },
  {
    timestamps: true,
  }
);

Chaperone.index({ coordinates: "2dsphere" });
const chaperoneModel = mongoose.model("chaperone", Chaperone);
export default chaperoneModel;
