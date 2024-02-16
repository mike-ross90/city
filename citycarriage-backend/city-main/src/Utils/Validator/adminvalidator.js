import joi from "joi";

export const designationValidator = joi.object({
  title: joi.string().required(),
});

export const aboutValidator = joi.object({
  title: joi.string().required(),
});
export const notificationValidator = joi.object({
  title: joi.string().required(),
  body: joi.string().required(),
  userId: joi.array(),
  allUser: joi.boolean(),
});
