import { Router, application } from "express";
import AuthController from "../Controller/AuthController.js";
// import ReviewController from "../Controller/ReviewController.js";

import {
  AuthMiddleware,
  EphemeralAccessMiddleware,
} from "./Middleware/AuthMiddleware.js";
import RideController from "../Controller/rideController.js";
import StripeController from "../Controller/StripeController.js";
import PaymentController from "../Controller/Payment/PaymentController.js";
import UserController from "../Controller/UserController.js";

export let AuthRouters = Router();

// AuthRouters.route("/register").post(AuthController.registerUser);

AuthRouters.route("/sendpayment").post(StripeController.CreatePayment);
AuthRouters.route("/login").post(AuthController.LoginUser);
AuthRouters.route("/forgetpassword").post(AuthController.forgetPassword);
AuthRouters.route("/sociallogin").post(AuthController.userSocialLogin);

AuthRouters.route("/distanceFareCalc").post(
  RideController.distanceFareCalculator
);
// AuthRouters.route("/getreviewbychaperone").get(
//   ReviewController.getReviewbyChaperone
// );

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(AuthRouters);
  this.use(path, middleware, AuthRouters);
  return AuthRouters;
};

AuthRouters.route("/createprofile").post(AuthController.createProfile);
AuthRouters.prefix("/auth", EphemeralAccessMiddleware, async function () {
  AuthRouters.route("/completedriverprofile").post(
    AuthController.completeDriverProfile
  );
  AuthRouters.route("/completeuserprofile").post(
    AuthController.completeUserProfile
  );
  AuthRouters.route("/verifyprofile").post(AuthController.verifyProfile);
});

AuthRouters.prefix("/user", AuthMiddleware, async function () {
  AuthRouters.route("/updateUser").post(AuthController.updateUser);
  AuthRouters.route("/updateDriver").post(AuthController.updateDriver);
  AuthRouters.route("/getUserProfile").get(AuthController.getUserProfile);
  AuthRouters.route("/getDriverProfile").get(AuthController.getDriverProfile);
  AuthRouters.route("/likeDriver").post(AuthController.likeDriver);
  AuthRouters.route("/getLikedDrivers").get(AuthController.getLikedDrivers);
  AuthRouters.route("/resetpassword").post(AuthController.resetpassword);
  AuthRouters.route("/createfeedback").post(UserController.createContactForm);
  AuthRouters.route("/Verify").post(AuthController.VerifyOtp);
  AuthRouters.route("/logout").post(AuthController.logout);
  AuthRouters.route("/changepassword").post(AuthController.changePassword);
  AuthRouters.route("/prebook").post(RideController.preBookRide);
  AuthRouters.route("/singleridehsitory").get(
    RideController.GetSinglepreBookRidebyUser
  );
  AuthRouters.route("/getridehisory").get(RideController.GetRideHisory);
  AuthRouters.route("/allprebooking").get(
    RideController.GetAllpreBookRidebyUser
  );

  AuthRouters.route("/instantridebook").post(RideController.instantRideBook);
  AuthRouters.route("/getsavedlocations").get(RideController.GetSavedLocations);
});
