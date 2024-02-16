import mongoose from "mongoose";

const AuthSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
    },
    isProfileCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isWalletCreated: {
      type: Boolean,
      required: false,
      default: false,
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    // phone: {
    //   type: String,
    //   trim: true,
    //   required: false,
    //   default: "",
    // },
    userType: {
      type: String,
      enum: ["user", "driver", "admin"],
      default: "user",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    notificationOn: {
      type: Boolean,
      default: true,
    },
    devices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: "device",
      },
    ],
    otp: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "otp",
      default: null,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
    },
  },
  {
    timestamps: true,
  }
);

const authModel = mongoose.model("auth", AuthSchema);
export default authModel;
