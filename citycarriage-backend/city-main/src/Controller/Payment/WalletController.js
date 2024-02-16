import CustomSuccess from "../../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";
import Wallet from "../../DB/Model/Payments/wallets.js";
import authModel from "../../DB/Model/authModel.js";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const STRIPEKEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPEKEY);

const connectWallet = async (req, res, next) => {
  try {
    const { user } = req;
    const { first_name, email, card_number, exp_month, exp_year, cvc } =
      req.body;

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: card_number,
        exp_month: exp_month,
        exp_year: exp_year,
        cvc: cvc,
      },
    });

    const customer = await stripe.customers.create({
      name: first_name,
      email: email,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    const fetchWallet = await Wallet.findOne({ userId: user._id });
    if (fetchWallet) {
      await Wallet.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          customerId: customer.id,
          paymentMethodId: paymentMethod.id,
        },
        { new: true, upsert: true }
      );
    } else {
      await Wallet.create({
        userId: user._id,
        customerId: customer.id,
        paymentMethodId: paymentMethod.id,
      });
    }
    await authModel.findByIdAndUpdate(
      user._id,
      { isWalletCreated: true },
      { new: true }
    );
    return next(
      CustomSuccess.createSuccess("", "Wallet has been created of a user", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const getUserWallet = async (req, res, next) => {
  try {
    const { user } = req;
    const fetchUserWallet = await Wallet.findOne({
      userId: user._id,
    });
    if (!fetchUserWallet) {
      return next(CustomError.notFound("Wallet for this user does not exist"));
    }
    return next(
      CustomSuccess.createSuccess(
        fetchUserWallet,
        "User wallet fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const WalletControllers = {
  connectWallet,
  getUserWallet,
};
export default WalletControllers;
