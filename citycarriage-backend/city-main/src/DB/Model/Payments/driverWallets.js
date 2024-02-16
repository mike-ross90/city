import mongoose from "mongoose";
const driverWalletSchema =  mongoose.Schema(
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
  
  },
  {
    timestamps: true,
  }
);

const driverWallet = new mongoose.model("driverWallet", driverWalletSchema);
export default driverWallet;

