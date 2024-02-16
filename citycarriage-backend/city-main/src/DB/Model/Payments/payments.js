import mongoose from "mongoose";

const PaymentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    paymentIntentId: {
      type: String,
      required: false,
    },
    isRefund: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = new mongoose.model("payment", PaymentSchema);
export default Payment;

