import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    medication: {
      type: String,
      required: false,
    },
    medicalCondition: {
      type: String,
      required: false,
    },
    allergies: {
      type: String,
      required: false,
    },
    emergencyNumber: {
      type: String,
      required: false,
    },
    pharmacyName: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    medicalCard: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
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

UserSchema.index({ location: "2dsphere" });
const userModel = mongoose.model("user", UserSchema);
export default userModel;
