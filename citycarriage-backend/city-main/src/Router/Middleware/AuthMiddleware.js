import authModel from "../../DB/Model/authModel.js";
import { joseJwtDecrypt } from "../../Utils/AccessTokenManagement/Tokens.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";
export const AuthMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];

  console.log(AuthHeader, "checking");

  if (!AuthHeader) {
    return next(CustomError.unauthorized("Auth header unauthorized"));
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized("Parts length is not equal to 2"));
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized("Bearer issue"));
    }

    const UserToken = await joseJwtDecrypt(token);

    const UserDetail = await authModel.findOne({ _id: UserToken.payload.uid });
    // .populate("image");

    if (!UserDetail) {
      // return next(CustomError.unauthorized());
      console.log("not user detail");
    }
    UserDetail.tokenType = UserToken.payload.tokenType;
    req.user = UserDetail;
    return next();
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

export const EphemeralAccessMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];
  if (!AuthHeader) {
    return next(CustomError.unauthorized());
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized());
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized());
    }

    const UserToken = await joseJwtDecrypt(token);

    if (!UserToken) {
      return next(CustomError.unauthorized());
    }

    req.user = UserToken;
    return next();
  } catch (error) {
    return next(CustomError.unauthorized());
  }
};

export const AdminMiddleware = async (req, res, next) => {
  const AuthHeader =
    req.headers.authorization ||
    req.body.token ||
    req.query.token ||
    req.headers["x-access-token"];

  if (!AuthHeader) {
    return next(CustomError.unauthorized());
  }
  const parts = AuthHeader.split(" ");
  try {
    if (parts.length !== 2) {
      return next(CustomError.unauthorized());
    }

    const [scheme, token] = parts;
    // token

    if (!/^Bearer$/i.test(scheme)) {
      return next(CustomError.unauthorized());
    }

    const UserToken = await joseJwtDecrypt(token);

    const UserDetail = await authModel
      .findOne({ _id: UserToken.payload.uid })
      .populate("image");

    if (!UserDetail && UserDetail.userType == "admin") {
      return next(CustomError.unauthorized());
    }

    req.user = UserDetail;
    return next();
  } catch (error) {
    console.log(error);
    return next(CustomError.unauthorized());
  }
};
