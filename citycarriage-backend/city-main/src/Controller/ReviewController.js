import { createReviewValidator } from "../Utils/Validator/reviewValidator.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import reviewModel from "../DB/Model/reviewModel.js";
import driverModel from "../DB/Model/driverModel.js";
import authModel from "../DB/Model/authModel.js";

const postReview = async (req, res, next) => {
  try {
    const { rideId, rating, driverId } = req.body;

    const { error } = createReviewValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const findReview = await reviewModel.find({
      userId: req.user._id,
      rideId,
      rating,
    });
    if (findReview) {
      return next(CustomError.createError("Review already given", 409));
    }

    const createReview = await reviewModel.create({
      userId: req.user._id,
      rating,
      driverId,
      rideId,
    });

    const reviews = await reviewModel.find({ driverId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await driverModel.findOneAndUpdate(
      { userId: driverId },
      { $set: { rating: averageRating } },
      { new: true }
    );

    return next(
      CustomSuccess.createSuccess(createReview, "Thanks for the review", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const ReviewController = {
  postReview,
};

export default ReviewController;
