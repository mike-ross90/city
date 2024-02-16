import mongoose from "mongoose";

const feedbackSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    subject: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    images: {
      type: mongoose.Schema.Types.Array,
    },
  },
  {
    timestamps: true,
  }
);

const feedbackModel = mongoose.model("feedback", feedbackSchema);

export default feedbackModel;
