import Wallet from "../../DB/Model/Payments/wallets.js";
import Payment from "../../DB/Model/Payments/payments.js";
import authModel from "../../DB/Model/authModel.js";
import connectedAccount from "../../DB/Model/Payments/connectAccounts.js";
import driverWallet from "../../DB/Model/Payments/driverWallets.js";
import RideModel from "../../DB/Model/rideModel.js";
import Stripe from "stripe";
import CustomSuccess from "../../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";
import TransactionHistory from "../../DB/Model/Payments/transactionHistory.js";

const STRIPEKEY =
  "sk_test_51N6z0WCSqEAeQmco5oYdduocrsMEG55iW5qXyz9rB9X0MAFUM7mgZlKN0jeGemUJrIIYlAentHB2P9UDSUisLRrF00tMByKHA3";
const stripe = new Stripe(STRIPEKEY);

// const stripe = require('stripe')('sk_test_51N6z0WCSqEAeQmco5oYdduocrsMEG55iW5qXyz9rB9X0MAFUM7mgZlKN0jeGemUJrIIYlAentHB2P9UDSUisLRrF00tMByKHA3');

// const paymentMethod = await stripe.customers.retrievePaymentMethod(
//   'cus_O0HRmhZ3J1GKa7',
//   'pm_1OFiL5CSqEAeQmcotWzyF6jp'
// );

const GetPaymentMethod = async (req, res, next) => {
  const { user } = req;
  const fetchUser = await Wallet.findOne({ userId: user });

  if (!fetchUser) {
    return next(CustomError.badRequest("No Payment Method Found"));
  }
  try {
    const paymentMethod = await stripe.customers.retrievePaymentMethod(
      fetchUser.customerId,
      fetchUser.paymentMethodId
    );

    return next(
      CustomSuccess.createSuccess(
        { paymentMethod },
        "Payment Methods Retreived",
        200
      )
    );
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

const insertPayment = async (req, res, next) => {
  try {
    const { user } = req;
    const { amount } = req.body;
    const fetchUser = await Wallet.findOne({ userId: user });
    if (!fetchUser) {
      return next(CustomError.badRequest("Wallet Does'nt Exists"));
    }
    const createPaymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      customer: fetchUser.customerId,
      payment_method: fetchUser.paymentMethodId,
    });

    return next(
      CustomSuccess.createSuccess(
        { createPaymentIntent },
        "Payment confirmation Needed",
        200
      )
    );

    // return res.status(200).send({
    //   // data:createPaymentIntent,
    //   success: false,
    //   amount: req.body.amount,
    //   message: "Payment confirmation Needed",
    //   client_secret: createPaymentIntent.client_secret,
    //   paymentIntentId: createPaymentIntent.id,
    // });
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { user } = req;
    const { PaymentIntent } = req.body;
    //const fetchUser = await Wallet.findOne({ userId: user });

    const paymentIntent = await stripe.paymentIntents.retrieve(PaymentIntent);

    const FindPaymentIntent = await Payment.findOne({
      paymentIntentId: PaymentIntent,
    });
    if (FindPaymentIntent) {
      return next(CustomError.badRequest("Already Confirmed"));
    }
    //if (paymentIntent.status === "succeeded") {
    const newPayment = await Payment.create({
      userId: user._id,
      amount: paymentIntent.amount,
      paymentIntentId: PaymentIntent,
    });

    await Wallet.updateOne(
      {
        userId: user._id,
      },
      { $inc: { amount: parseInt(paymentIntent.amount) / 100 } }
    );
    const insertDebitAmount = new TransactionHistory({
      userId: user._id,
      amount: parseInt(paymentIntent.amount) / 100,
      status: "credit",
    });

    // const insertDebitAmount = new TransactionHistory({
    //   userId: user._id,
    //   amount: parseInt(paymentIntent.amount) / 100,
    //   status: "debit",
    // });

    await insertDebitAmount.save();

    return next(
      CustomSuccess.createSuccess(
        { amount: parseInt(paymentIntent.amount) / 100 },
        "Payment Added Succesfully",
        200
      )
    );
    // } else {
    //   return next(CustomError.badRequest(paymentIntent.status));
    // }
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};
const sendPayment = async (req, res) => {
  try {
    const { user } = req;
    const { amount, receiver, rideId } = req.body;

    const checkPayment = await RideModel.findById(rideId);
    if (checkPayment.havePaid == true) {
      return res.status(400).send({
        success: false,
        message: "Already Paid",
      });
    }

    const fetchWallet = await Wallet.findOne({ userId: user._id });
    if (!fetchWallet) {
      return res.status(400).send({
        success: false,
        message: "You Do not have Wallet",
      });
    }

    if (fetchWallet.amount === 0) {
      return res.status(400).send({
        success: false,
        message: "You do not have amount in your Wallet",
      });
    }

    if (fetchWallet.amount < req.body.amount) {
      return res.status(400).send({
        success: false,
        message: `You do not have much amount. Your current balance is ${fetchWallet.amount}`,
      });
    }
    const fetchUser = await authModel.findOne({
      _id: receiver,
    });
    if (!fetchUser) {
      return res.status(400).send({
        success: false,
        message: "Receiver Not Found Of This ID",
      });
    }

    const fetchAccount = await connectedAccount.findOne({
      userId: receiver,
    });

    if (!fetchAccount) {
      return res.status(400).send({
        success: false,
        message: "Receiver Do not have Account",
      });
    }

    // const transfer = await stripe.transfers.create({
    //   amount: amount * 100,
    //   currency: "usd",
    //   destination: fetchAccount.connectAccountId,
    // });

    await Wallet.updateOne(
      {
        userId: user._id,
      },
      { $inc: { amount: -amount } }
    );

    const fetchDriver = await driverWallet.findOne({ userId: receiver });
    if (fetchDriver) {
      await driverWallet.updateOne(
        {
          userId: receiver,
        },
        { $inc: { amount: amount } }
      );
    } else {
      const createDriverWallet = new driverWallet({
        userId: receiver,
        amount: amount,
      });
      await createDriverWallet.save();
    }

    const newPayment = new Payment({
      userId: user._id,
      amount: amount,
    });

    await newPayment.save();

    const insertDebitAmount = new TransactionHistory({
      userId: receiver,
      amount: amount,
      status: "debit",
      sendBy: user._id,
    });

    await insertDebitAmount.save();

    const insertCreditAmount = new TransactionHistory({
      userId: user._id,
      amount: amount,
      status: "credit",
      receiveBy: receiver,
    });

    await insertCreditAmount.save();

    // await Wallet.updateOne(
    //   {
    //     userId: user._id,
    //   },
    //   { $inc: { amount: amount } }
    // );
    await RideModel.findByIdAndUpdate(rideId, { havePaid: true });

    return res.status(200).send({
      success: true,
      message: "Payment has been transfer to a User",
      // data: transfer,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

const getAllPayment = async (req, res, next) => {
  try {
    const { user } = req;
    const fetchPayment = await Payment.find({ userId: user._id });
    if (!fetchPayment) {
      return next(CustomError.notFound("Payments not found for this user"));
    }

    return next(
      CustomSuccess.createSuccess(
        { payments: fetchPayment },
        "Payments fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

// const succeededPayment = async (req, res) => {
//   try {
//     const newPayment = new payment({
//       userId: req.user._id,
//       amount: req.body.amount,
//       paymentIntentId: req.body.paymentIntentId,
//     });

//     await newPayment.save();

//     await wallet.updateOne(
//       {
//         userId: req.user._id,
//       },
//       { $inc: { amount: req.body.amount } }
//     );

//     return res.status(200).send({
//       success: true,
//       message: "Payment has been created of a User",
//       data: newPayment,
//     });
//   } catch (e) {
//     console.log(e);
//     return res.status(400).send(e);
//   }
// };

const withDrawPayment = async (req, res) => {
  try {
    const { user } = req;
    const { amount } = req.body;

    const fetchAccount = await connectedAccount.findOne({
      userId: user._id,
    });
    if (!fetchAccount) {
      return res.status(400).send({
        success: false,
        message: "You Do not have Stripe Account",
      });
    }

    const fetchWallet = await driverWallet.findOne({ userId: user._id });
    if (!fetchWallet) {
      return res.status(400).send({
        success: false,
        message: "Your Wallet is empty",
      });
    }
    if (fetchWallet.amount < amount) {
      return res.status(400).send({
        success: false,
        message: `You Do not have Much Amount. Your current balance is ${fetchWallet.amount}`,
      });
    }

    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: "usd",
      destination: fetchAccount.connectAccountId,
    });

    await driverWallet.updateOne(
      {
        userId: user._id,
      },
      { $inc: { amount: -amount } }
    );

    const insertCreditAmount = new TransactionHistory({
      userId: user._id,
      amount: amount,
      status: "credit",
    });

    await insertCreditAmount.save();

    return res.status(200).send({
      success: true,
      message: "Payment has been Withdraw by a User",
      data: transfer,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

const getDriverWalletAmount = async (req, res, next) => {
  try {
    const { user } = req;

    const fetchAccount = await connectedAccount.findOne({
      userId: user._id,
    });
    if (!fetchAccount) {
      return next(CustomError.notFound("Please create driver stripe account"));
    }

    const fetchDriverWallet = await driverWallet.findOne({ userId: user._id });
    if (!fetchDriverWallet) {
      return next(CustomError.notFound("Wallet for this driver not found"));
    }

    return next(
      CustomSuccess.createSuccess(
        fetchDriverWallet.amount,
        "Driver wallet fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const { user } = req;
    const fetchUser = await authModel
      .findOne({
        _id: user._id,
      })
      .select({ _id: 1, userType: 1 });

    if (fetchUser.userType === "user") {
      const fetchWallet = await Wallet.findOne({ userId: user._id });
      if (!fetchWallet) {
        return res.status(400).send({
          success: false,
          message: "No Wallet Found",
        });
      }
    } else if (fetchUser.userType === "driver") {
      const fetchAccount = await connectedAccount.findOne({ userId: user._id });
      if (!fetchAccount) {
        return res.status(400).send({
          success: false,
          message: "No Wallet Found",
        });
      }
    }

    let fetchDebitHistory;

    if (!req.query.status) {
      fetchDebitHistory = await TransactionHistory.find({
        userId: user._id,
      })
        .select({ updatedAt: 0, userId: 0 })
        .populate({
          path: "sendBy",
          select: "_id fullName image",
          populate: {
            path: "image",
            select: "file fileType",
          },
        })
        .populate({
          path: "receiveBy",
          select: "_id fullName image",
          populate: {
            path: "image",
            select: "file fileType",
          },
        });
    } else {
      fetchDebitHistory = await TransactionHistory.find({
        userId: user._id,
        status: req.query.status,
      })
        .select({ updatedAt: 0, userId: 0 })
        .populate({
          path: "sendBy",
          select: "_id fullName image",
          populate: {
            path: "image",
            select: "file fileType",
          },
        })
        .populate({
          path: "receiveBy",
          select: "_id fullName image",
          populate: {
            path: "image",
            select: "file fileType",
          },
        });
    }
    return res.status(200).send({
      success: true,
      message: "Fetch Debit History Successfully",
      data: fetchDebitHistory,
    });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
};

const PaymentController = {
  insertPayment,
  sendPayment,
  getAllPayment,
  withDrawPayment,
  GetPaymentMethod,
  confirmPayment,
  getDriverWalletAmount,
  getTransactionHistory,
};
export default PaymentController;
