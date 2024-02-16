import mongoose from "mongoose";

const transactionHistorySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    amount: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    sendBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
      default: null,
    },
    receiveBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "auth",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const TransactionHistory = new mongoose.model(
  "transactionHistory",
  transactionHistorySchema
);
export default TransactionHistory;
