import mongoose from "mongoose";

const ProfileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    firstName: {
      type: mongoose.Schema.Types.String,
      required: false,
      trim: true,
    },
    lastName: {
      type: mongoose.Schema.Types.String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      required: false,
      default: "",
    },
    dateOfBirth: {
      type: mongoose.Schema.Types.Date,
      required: false,
      trim: true,
    },
    gender: {
      type: mongoose.Schema.Types.String,
      enum: ["male", "female"],
      required: true,
      trim: true,
    },
    address: {
      type: mongoose.Schema.Types.String,
      required: false,
      trim: true,
    },
    city: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
    state: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
    postalCode: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
    profilePictureUrl: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
    },
    musics: {
      type: mongoose.Schema.Types.String,
      required: false,
    },

    interests: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
    hobbies: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// ProfileSchema.index({ coordinates: "2dsphere" });
const profileModel = mongoose.model("profile", ProfileSchema);
export default profileModel;
