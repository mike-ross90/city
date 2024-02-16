import mongoose from "mongoose";

const ConnnectSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    connectAccountId: {
      type: String,
      required: true,
    },
    accountNumberLast4Digit: {
      type: String,
      required: true,
    },
    businessName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const connectedAccount = new mongoose.model("connectedAccount", ConnnectSchema);
export default connectedAccount;
