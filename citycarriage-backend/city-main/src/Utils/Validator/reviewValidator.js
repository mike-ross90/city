import joi from "joi";

export const createReviewValidator = joi.object({
  driverId: joi.string().required(),
  rideId: joi.string().required(),
  rating: joi.number().required().min(1).max(5).precision(1),
});
