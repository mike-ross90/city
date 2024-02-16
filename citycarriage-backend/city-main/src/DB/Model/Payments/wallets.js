import mongoose from "mongoose";
const WalletSchema =  mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    customerId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: false,
      default: 0,
    },
    paymentMethodId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = new mongoose.model("wallet", WalletSchema);
export default Wallet;

