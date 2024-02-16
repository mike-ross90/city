import { Router, application } from "express";
import { AdminMiddleware } from "./Middleware/AuthMiddleware.js";
import AdminController from "../Controller/AdminController.js";
import AuthController from "../Controller/AuthController.js";
import UserController from "../Controller/UserController.js";

export let AdminRouters = Router();

AdminRouters.route("/getallusers").get(AdminController.getAllUsers);
application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(AdminRouters);
  this.use(path, middleware, AdminRouters);
  return AdminRouters;
};

//const contentController = require("../controllers/contentController");

//router.post("/", contentController.upload.single("file"), contentController.createContent);

AdminRouters.prefix("/admin", AdminMiddleware, () => {
  AdminRouters.route("/getallusers").get(AdminController.getAllUsers);
  AdminRouters.route("/getallchaperone").get(AdminController.getAllChaperones);
  AdminRouters.route("/deleteuser/:id").patch(AdminController.deleteUser);
  AdminRouters.route("/updatedriverstatus/:id").patch(AdminController.updateDriverStatus);
  
  AdminRouters.route("/sendNotification").post(
    AdminController.SendNotification
  );
  
  //// Post Api endpoints
  AdminRouters.route("/about").post(AdminController.postAbout);
  AdminRouters.route("/terms").post(AdminController.postTerms);
  AdminRouters.route("/privacy").post(AdminController.postPrivacy);
  AdminRouters.route("/faq").post(AdminController.PostFaq);
  //// Delete Api endpoints
  AdminRouters.route("/about").delete(AdminController.deleteAbout);
  AdminRouters.route("/terms").delete(AdminController.deleteTerms);
  AdminRouters.route("/privacy").delete(AdminController.deletePrivacy);
});

//// Get Api endspoints
AdminRouters.route("/about").get(AdminController.getAbout);
AdminRouters.route("/terms").get(AdminController.getTerms);
AdminRouters.route("/privacy").get(AdminController.getPrivacy);
AdminRouters.route("/faq").get(AdminController.getFaq);


// AdminRouters.prefix("/admin", AdminMiddleware, () => {
//   AdminMiddleware.route("")
// })