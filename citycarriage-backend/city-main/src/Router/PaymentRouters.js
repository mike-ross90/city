import { Router, application } from "express";

import { AuthMiddleware } from "./Middleware/AuthMiddleware.js";

import PaymentController from "../Controller/Payment/PaymentController.js";
import WalletControllers from "../Controller/Payment/WalletController.js";
import connectController from "../Controller/Payment/ConnectConroller.js";

export let PaymentRouters = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(PaymentRouters);
  this.use(path, middleware, PaymentRouters);
  return PaymentRouters;
};

PaymentRouters.prefix("/payment", AuthMiddleware, async function () {
  PaymentRouters.route("/createwallet").post(WalletControllers.connectWallet);
  PaymentRouters.route("/getUserWallet").get(WalletControllers.getUserWallet);
  PaymentRouters.route("/insertpayment").post(PaymentController.insertPayment);
  PaymentRouters.route("/sendpayment").post(PaymentController.sendPayment);
  PaymentRouters.route("/createstripeaccount").post(
    connectController.createStripeAccount
  );
  PaymentRouters.route("/getpayments").get(PaymentController.getAllPayment);
  PaymentRouters.route("/withdrawpayment").post(
    PaymentController.withDrawPayment
  );
  PaymentRouters.route("/getpaymentmethod").get(
    PaymentController.GetPaymentMethod
  );
  PaymentRouters.route("/confirmpayment").post(
    PaymentController.confirmPayment
  );
  PaymentRouters.route("/getDriverWalletAmount").get(
    PaymentController.getDriverWalletAmount
  );
  PaymentRouters.route("/getDriverAccount").get(
    connectController.getDriverAccount
  );
  PaymentRouters.route("/getTransactionHistory").get(
    PaymentController.getTransactionHistory
  );
});
