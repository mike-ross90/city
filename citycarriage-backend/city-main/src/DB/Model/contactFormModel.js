import mongoose from "mongoose";

const contactFormSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
    },
    email: {
      type: mongoose.Schema.Types.String,
    },
    name: {
      type: mongoose.Schema.Types.String,
    },
    phone: {
      type: mongoose.Schema.Types.String,
    },
    message: {
      type: mongoose.Schema.Types.String,
    },
  },
  {
    timestamps: true,
  }
);

const ContactFormModel = mongoose.model("contactForm", contactFormSchema);

export default ContactFormModel;
