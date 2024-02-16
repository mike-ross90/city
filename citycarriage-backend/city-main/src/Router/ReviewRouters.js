import { Router, application } from "express";
import { AuthMiddleware } from "./Middleware/AuthMiddleware.js";
import ReviewController from "../Controller/ReviewController.js";

export let ReviewRouters = Router();

application.prefix = Router.prefix = function (path, middleware, configure) {
  configure(ReviewRouters);
  this.use(path, middleware, ReviewRouters);
  return ReviewRouters;
};

ReviewRouters.prefix("/review", AuthMiddleware, async function () {
  ReviewRouters.route("/createReview").post(ReviewController.postReview);
});
