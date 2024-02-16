import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import favouriteModel from "../DB/Model/favouriteModel.js";
import profileModel from "../DB/Model/profileModel.js";
import driverModel from "../DB/Model/driverModel.js";
import DeviceModel from "../DB/Model/deviceModel.js";
import authModel from "../DB/Model/authModel.js";
import OtpModel from "../DB/Model/otpModel.js";
import bcrypt from "bcrypt";
import { linkUserDevice, unlinkUserDevice } from "../Utils/linkUserDevice.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { handleMultipartData } from "../Utils/MultipartData.js";
import { sendEmails } from "../Utils/SendEmail.js";
import { genSalt } from "../Utils/saltGen.js";
import {
  tokenGen,
  OtptokenGen,
} from "../Utils/AccessTokenManagement/Tokens.js";
import {
  LoginUserValidator,
  ResetPasswordValidator,
  changePasswordValidator,
  forgetpasswordValidator,
  socialLoginUserValidator,
  verifyOTPValidator,
} from "../Utils/Validator/UserValidator.js";

const userSocialLogin = async (req, res, next) => {
  try {
    const { error } = socialLoginUserValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const { email, userType, deviceType, deviceToken } = req.body;
    let user = await authModel.findOne({ email: email });
    if (user) {
      const token = await tokenGen(
        { id: user._id, userType: user.userType },
        "auth",
        deviceToken
      );

      if (user.userType === "user") {
        const profileDatas = await profileModel
          .findOne({ userId: user._id })
          .select("-createdAt -updatedAt -__v -_id")
          .populate({
            path: "userId",
            select: "_id userType isWalletCreated",
          })
          .populate({
            path: "profilePictureUrl",
            select: "-_id, file",
          });

        const profileData = {
          ...profileDatas.toObject(),
          email,
        };
        return next(
          CustomSuccess.createSuccess(
            { profileData, token },
            "User logged in successfully",
            200
          )
        );
      } else if (user.userType === "driver") {
        const profileDatas = await profileModel
          .findOne({
            userId: user._id,
          })
          .select("-createdAt -updatedAt -__v -_id")
          .populate({
            path: "userId",
            select: "_id userType isWalletCreated",
          })
          .populate({
            path: "profilePictureUrl",
            select: "-_id, file",
          });

        const driverDatas = await driverModel
          .findOne({
            userId: user._id,
          })
          .select(
            "-createdAt -updatedAt -__v -_id -isApproved -isOnline -isDeleted -rating"
          )
          .populate({
            path: "idCardPictureUrl",
            select: "-_id, file",
          });

        const profileData = {
          ...profileDatas.toObject(),
          email,
        };

        const driverData = {
          ...driverDatas.toObject(),
          email,
        };

        return next(
          CustomSuccess.createSuccess(
            { profileData, driverData, token },
            "Driver logged in successfully",
            200
          )
        );
      }
    }
    user = await authModel.create({
      email: email,
      userType: userType,
      isVerified: true,
    });

    const registerDevice = await new DeviceModel({
      deviceToken: deviceToken,
      deviceType: deviceType,
      user: user._id,
    }).save();

    const userData = await authModel.findByIdAndUpdate(
      user._id,
      {
        $push: { devices: registerDevice._id },
      },
      { new: true }
    );

    const token = await OtptokenGen({ userData, verified: true });

    return next(
      CustomSuccess.createSuccess(
        {
          isProfileCompleted: false,
          token,
        },
        "User signup successfully",
        200
      )
    );
  } catch (err) {
    return next(CustomError.createError(err.message, 500));
  }
};

const createProfile = async (req, res, next) => {
  try {
    const { email, password, userType } = req.body;
    const hashedPassword = hashPassword(password);

    const User = await authModel.findOne({ email });
    if (User) {
      return next(CustomError.createError("Email already exists", 409));
    }
    // if (User) {
    //   const userData = {
    //     email: User.email,
    //     password: User.password,
    //     userType: User.userType,
    //   };

    //   const token = await OtptokenGen({ userData, verified: true });

    //   return next(
    //     CustomSuccess.createSuccess(
    //       { token, isProfileCompleted: false, userType: userType },
    //       "Email already exists",
    //       200
    //     )
    //   );
    // }

    let otp = Math.floor(Math.random() * 9000) + 1000;
    const emailData = {
      subject: "City Carriage - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >
    <img 
          style="
          top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
          src="cid:background" alt="background" 
    />
    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
      <div class="logo" style="text-align:center;">
        <img 
          style="width: 150px;" 
          src="cid:logo" alt="logo" />
      </div>
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To City Carriage</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi,</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #FD6F3B; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png",
          cid: "logo",
          contentDisposition: "inline",
        },
      ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );

    const newUser = {
      email,
      password: hashedPassword,
      userType,
    };

    const token = await OtptokenGen({ newUser, otp });
    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        "OTP sent to registered email",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const verifyProfile = async (req, res, next) => {
  try {
    const { user } = req;
    const { otp } = req.body;

    const TokenOtp = user.payload.userData.otp;
    const userData = user.payload.userData.newUser;

    console.log(userData.email, "checking");

    if (TokenOtp !== otp) {
      return next(CustomError.createError("Invalid OTP", 401));
    }

    const token = await OtptokenGen({ userData, verified: true });

    let data = await authModel.findOne({ email: userData.email });
    if (!data) {
      const authData = {
        // phone,
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
      };
      data = await authModel.create(authData);
      data.save();
    }

    return next(
      CustomSuccess.createSuccess(
        { token, userData },
        "Signed up successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

// const completeDriverProfile = async (req, res, next) => {
//   try {
//     const user = req.user;
//     if (!user) {
//       return next(CustomError.notFound("User not found"));
//     }

//     if (user.payload.userData.userData.userType !== "driver") {
//       return next(CustomError.forbidden("Only driver can create his profile"));
//     }

//     const verified = user.payload.userData.verified;
//     const { email, password, phone, userType } = user.payload.userData.userData;
//     if (!verified) {
//       return next(CustomError.badRequest("Unverified Driver"));
//     }

//     let findDriver = await authModel.findOne({ email });

//     if (!req.files.profilePictureUrl) {
//       return next(CustomError.badRequest("Profile not found"));
//     }
//     const profielImagefile = req.files.profilePictureUrl[0];

//     const profileFileData = {
//       file: profielImagefile.filename,
//       fileType: profielImagefile.mimetype,
//       user: findDriver._id,
//     };
//     const FileUploadModelProfile = await fileUploadModel.create(
//       profileFileData
//     );

//     await authModel.findByIdAndUpdate(
//       findDriver._id,
//       {
//         image: FileUploadModelProfile._id,
//         isProfileCompleted: true,
//       },
//       { new: true }
//     );
//     await profileModel.findByIdAndUpdate(
//       findDriver._id,
//       {
//         profilePictureUrl: FileUploadModelProfile._id,
//       },
//       { new: true }
//     );

//     const profileData = {
//       firstName: req.body.firstName,
//       lastName: req.body.lastName,
//       dateOfBirth: req.body.dateOfBirth,
//       gender: req.body.gender,
//       address: req.body.address,
//       city: req.body.city,
//       state: req.body.state,
//       postalCode: req.body.postalCode,
//       phone: req.body.phone,
//       email: email,
//       userId: {
//         _id: findDriver._id,
//         userType: findDriver.userType,
//         isWalletCreated: findDriver.isWalletCreated,
//       },
//       profilePictureUrl: FileUploadModelProfile._id,
//     };

//     const Profile = new profileModel(profileData);
//     const response = {
//       profileData,
//     };

//     if (Profile.profilePictureUrl) {
//       const uploadedFile = await fileUploadModel.findById(
//         Profile.profilePictureUrl
//       );
//       response.profileData.profilePictureUrl = { file: uploadedFile.file };
//     }
//     await Profile.save();

//     if (!req.files.idCardPictureUrl) {
//       return next(CustomError.badRequest("idCard not found"));
//     }

//     const idCardImagefile = req.files.idCardPictureUrl[0];
//     const idCardfileData = {
//       file: idCardImagefile.filename,
//       fileType: idCardImagefile.mimetype,
//       user: findDriver._id,
//     };

//     const FileUploadModelIdCard = await fileUploadModel.create(idCardfileData);
//     await driverModel.findByIdAndUpdate(
//       findDriver._id,
//       {
//         idCardPictureUrl: FileUploadModelIdCard._id,
//       },
//       { new: true }
//     );

//     const driverData = {
//       vehicleNo: req.body.vehicleNo,
//       vehicleName: req.body.vehicleName,
//       experience: req.body.experience,
//       licenceNumber: req.body.licenceNumber,
//       licenceExpiry: req.body.licenceExpiry,
//       hourlyFare: req.body.hourlyFare,
//       userId: findDriver._id,
//       email: email,
//       idCardPictureUrl: FileUploadModelIdCard._id,
//     };

//     const Driver = new driverModel(driverData);
//     const responses = {
//       driverData,
//     };

//     if (Driver.idCardPictureUrl) {
//       const uploadedFile = await fileUploadModel.findById(
//         Driver.idCardPictureUrl
//       );
//       responses.driverData.idCardPictureUrl = {
//         file: uploadedFile.file,
//       };
//     }
//     await Driver.save();

//     const token = await tokenGen(
//       { id: findDriver._id, userType: findDriver.userType },
//       "auth",
//       findDriver.deviceToken
//     );

//     return next(
//       CustomSuccess.createSuccess(
//         { profileData, driverData, token },
//         "Profile created successfully",
//         200
//       )
//     );
//   } catch (error) {
//     return next(CustomError.createError(error.message, 400));
//   }
// };

const completeDriverProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(CustomError.notFound("User not found"));
    }

    if (user.payload.userData.userData.userType !== "driver") {
      return next(CustomError.forbidden("Only driver can create his profile"));
    }

    const verified = user.payload.userData.verified;
    const { email, password, phone, userType } = user.payload.userData.userData;
    if (!verified) {
      return next(CustomError.badRequest("Unverified Driver"));
    }

    let findDriver = await authModel.findOne({ email });

    if (!req.files.profilePictureUrl) {
      return next(CustomError.badRequest("Profile not found"));
    }
    const profielImagefile = req.files.profilePictureUrl[0];
    const profileFileData = {
      file: profielImagefile.filename,
      fileType: profielImagefile.mimetype,
      user: findDriver._id,
    };
    const FileUploadModelProfile = await fileUploadModel.create(
      profileFileData
    );
    await authModel.findByIdAndUpdate(
      findDriver._id,
      {
        image: FileUploadModelProfile._id,
        isProfileCompleted: true,
      },
      { new: true }
    );
    await profileModel.findByIdAndUpdate(
      findDriver._id,
      {
        profilePictureUrl: FileUploadModelProfile._id,
      },
      { new: true }
    );

    if (!req.files.idCardPictureUrl) {
      return next(CustomError.badRequest("idCard not found"));
    }
    const idCardImagefile = req.files.idCardPictureUrl[0];
    const idCardfileData = {
      file: idCardImagefile.filename,
      fileType: idCardImagefile.mimetype,
      user: findDriver._id,
    };
    const FileUploadModelIdCard = await fileUploadModel.create(idCardfileData);
    await driverModel.findByIdAndUpdate(
      findDriver._id,
      {
        idCardPictureUrl: FileUploadModelIdCard._id,
      },
      { new: true }
    );

    if (userType === "driver") {
      const driverData = {
        vehicleNo: req.body.vehicleNo,
        vehicleName: req.body.vehicleName,
        experience: req.body.experience,
        licenceNumber: req.body.licenceNumber,
        licenceExpiry: req.body.licenceExpiry,
        hourlyFare: req.body.hourlyFare,
        userId: findDriver._id,
        email: email,
      };
      const Driver = new driverModel(driverData);

      if (req.files.idCardPictureUrl && req.files.idCardPictureUrl.length > 0) {
        const file = req.files.idCardPictureUrl[0];
        const fileData = {
          file: file.filename,
          fileType: file.mimetype,
          user: findDriver._id,
        };
        const FileUploadModel = await fileUploadModel.create(fileData);
        Driver.idCardPictureUrl = FileUploadModel._id;
      }
      await Driver.save();

      var response = {
        driverData,
      };
      if (Driver.idCardPictureUrl) {
        const uploadedFile = await fileUploadModel.findById(
          Driver.idCardPictureUrl
        );
        response.driverData.idCardPictureUrl = { file: uploadedFile.file };
      }

      const profileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        phone: req.body.phone,
        userId: {
          _id: findDriver._id,
          userType: findDriver.userType,
          isWalletCreated: findDriver.isWalletCreated,
        },
        email: email,
      };

      const Profile = new profileModel(profileData);

      if (
        req.files.profilePictureUrl &&
        req.files.profilePictureUrl.length > 0
      ) {
        const file = req.files.profilePictureUrl[0];
        const fileData = {
          file: file.filename,
          fileType: file.mimetype,
          user: findDriver._id,
        };
        const FileUploadModel = await fileUploadModel.create(fileData);
        Profile.profilePictureUrl = FileUploadModel._id;
      }
      await Profile.save();

      var response = {
        profileData,
      };
      if (Profile.profilePictureUrl) {
        const uploadedFile = await fileUploadModel.findById(
          Profile.profilePictureUrl
        );
        response.profileData.profilePictureUrl = { file: uploadedFile.file };
      }

      const token = await tokenGen(
        { id: findDriver._id, userType: findDriver.userType },
        "auth",
        findDriver.deviceToken
      );

      return next(
        CustomSuccess.createSuccess(
          { profileData, driverData, token },
          "Profile created successfully",
          200
        )
      );
    }
  } catch (error) {
    return next(CustomError.createError(error.message, 400));
  }
};

// const completeUserProfile = async (req, res, next) => {
//   try {
//     const user = req.user;
//     if (!user) {
//       return next(CustomError.notFound("User not found"));
//     }

//     if (user.payload.userData.userData.userType !== "user") {
//       return next(CustomError.forbidden("Only user can create his profile"));
//     }

//     const verified = user.payload.userData.verified;
//     const { email, password, userType } = user.payload.userData.userData;
//     if (!verified) {
//       return next(CustomError.badRequest("Unverified User"));
//     }

//     let findUser = await authModel.findOne({ email });
//     // if (!findUser) {
//     //   const authData = {
//     //     // phone,
//     //     email,
//     //     password,
//     //     userType,
//     //   };
//     //   findUser = await authModel.create(authData);
//     //   findUser.save();
//     // }

//     if (!req.files.profilePictureUrl) {
//       return next(CustomError.badRequest("Profile not found"));
//     }
//     const profielImagefile = req.files.profilePictureUrl[0];
//     const profileFileData = {
//       file: profielImagefile.filename,
//       fileType: profielImagefile.mimetype,
//       user: findUser._id,
//     };
//     const FileUploadModelProfile = await fileUploadModel.create(
//       profileFileData
//     );
//     await authModel.findByIdAndUpdate(
//       findUser._id,
//       {
//         image: FileUploadModelProfile._id,
//         isProfileCompleted: true,
//       },
//       { new: true }
//     );
//     await profileModel.findByIdAndUpdate(
//       findUser._id,
//       {
//         profilePictureUrl: FileUploadModelProfile._id,
//       },
//       { new: true }
//     );

//     const profileData = {
//       firstName: req.body.firstName,
//       lastName: req.body.lastName,
//       dateOfBirth: req.body.dateOfBirth,
//       gender: req.body.gender,
//       address: req.body.address,
//       city: req.body.city,
//       state: req.body.state,
//       postalCode: req.body.postalCode,
//       phone: req.body.phone,
//       email: email,
//       userId: {
//         _id: findUser._id,
//         userType: findUser.userType,
//         isWalletCreated: findUser.isWalletCreated,
//       },
//       profilePictureUrl: FileUploadModelProfile._id,
//     };
//     const Profile = new profileModel(profileData);

//     const response = {
//       profileData,
//     };
//     if (Profile.profilePictureUrl) {
//       const uploadedFile = await fileUploadModel.findById(
//         Profile.profilePictureUrl
//       );
//       response.profileData.profilePictureUrl = { file: uploadedFile.file };
//     }
//     await Profile.save();

//     const token = await tokenGen(
//       { id: findUser._id, userType: findUser.userType },
//       "auth",
//       findUser.deviceToken
//     );

//     return next(
//       CustomSuccess.createSuccess(
//         { profileData, token },
//         "Profile created successfully",
//         200
//       )
//     );
//   } catch (error) {
//     return next(CustomError.createError(error.message, 400));
//   }
// };

const completeUserProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return next(CustomError.notFound("User not found"));
    }

    if (user.payload.userData.userData.userType !== "user") {
      return next(CustomError.forbidden("Only user can create his profile"));
    }

    const verified = user.payload.userData.verified;
    const { email, password, userType } = user.payload.userData.userData;
    if (!verified) {
      return next(CustomError.badRequest("Unverified User"));
    }

    let findUser = await authModel.findOne({ email });
    // if (!findUser) {
    //   const authData = {
    //     // phone,
    //     email,
    //     password,
    //     userType,
    //   };
    //   findUser = await authModel.create(authData);
    //   findUser.save();
    // }

    if (!req.files.profilePictureUrl) {
      return next(CustomError.badRequest("Profile not found"));
    }
    const profielImagefile = req.files.profilePictureUrl[0];
    const profileFileData = {
      file: profielImagefile.filename,
      fileType: profielImagefile.mimetype,
      user: findUser._id,
    };
    const FileUploadModelProfile = await fileUploadModel.create(
      profileFileData
    );
    await authModel.findByIdAndUpdate(
      findUser._id,
      {
        image: FileUploadModelProfile._id,
        isProfileCompleted: true,
      },
      { new: true }
    );
    await profileModel.findByIdAndUpdate(
      findUser._id,
      {
        profilePictureUrl: FileUploadModelProfile._id,
      },
      { new: true }
    );

    if (userType === "user") {
      const profileData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode,
        phone: req.body.phone,
        musics: req.body.musics,
        interests: req.body.interests,
        hobbies: req.body.hobbies,
        email: email,
        userId: {
          _id: findUser._id,
          userType: findUser.userType,
          isWalletCreated: findUser.isWalletCreated,
        },
      };
      const Profile = new profileModel(profileData);

      if (
        req.files.profilePictureUrl &&
        req.files.profilePictureUrl.length > 0
      ) {
        const file = req.files.profilePictureUrl[0];
        const fileData = {
          file: file.filename,
          fileType: file.mimetype,
          user: findUser._id,
        };
        const FileUploadModel = await fileUploadModel.create(fileData);
        Profile.profilePictureUrl = FileUploadModel._id;
      }
      await Profile.save();

      const response = {
        profileData,
      };
      if (Profile.profilePictureUrl) {
        const uploadedFile = await fileUploadModel.findById(
          Profile.profilePictureUrl
        );
        response.profileData.profilePictureUrl = { file: uploadedFile.file };
      }

      const token = await tokenGen(
        { id: findUser._id, userType: findUser.userType },
        "auth",
        findUser.deviceToken
      );

      return next(
        CustomSuccess.createSuccess(
          { profileData, token },
          "Profile created successfully",
          200
        )
      );
    }
  } catch (error) {
    return next(CustomError.createError(error.message, 400));
  }
};

// const updateUser = async (req, res, next) => {
//   try {
//     const { user } = req;
//     const data = Object.fromEntries(
//       Object.entries(req.body).filter(
//         ([_, v]) => v != null && v !== "" && v !== "null"
//       )
//     );

//     const findUser = await authModel.findOne({ _id: user._id });
//     if (!findUser) {
//       return next(CustomError.notFound("User not found "));
//     }
//     if (req.files.profilePictureUrl) {
//       const file = req.files.profilePictureUrl[0];
//       // const fileExist = await fileUploadModel.findOne({ user: findUser._id });
//       const FileUploadModel = await fileUploadModel.findOneAndUpdate(
//         { user: findUser._id },
//         {
//           file: file.filename,
//           fileType: file.mimetype,
//         },
//         { new: true }
//       );

//       await profileModel.findOneAndUpdate(
//         { userId: findUser._id },
//         {
//           profilePictureUrl: FileUploadModel._id,
//         },
//         { new: true }
//       );

//       await authModel.findOneAndUpdate(
//         { _id: findUser._id },
//         {
//           image: FileUploadModel._id,
//         },
//         { new: true }
//       );

//       // const FileUploadModel = await fileUploadModel.create({
//       //   file: file.filename,
//       //   fileType: file.mimetype,
//       //   user: findUser._id,
//       // });
//     }

//     const findUserType = await profileModel.findOne({
//       userId: findUser._id,
//     });
//     const profileDatas = await profileModel
//       .findByIdAndUpdate(findUserType._id, data, {
//         new: true,
//       })
//       .populate({
//         path: "userId",
//         select: "_id userType isWalletCreated",
//       })
//       .populate({
//         path: "profilePictureUrl",
//         select: "-_id file",
//       });

//     const profileData = {
//       ...profileDatas.toObject(),
//       email: findUser.email,
//     };

//     // const token = await tokenGen(
//     //   { id: findUser._id, userType: findUser.userType },
//     //   "auth",
//     //   data.deviceToken
//     // );

//     return next(
//       CustomSuccess.createSuccess(
//         { profileData },
//         "Profile updated successfully",
//         200
//       )
//     );
//   } catch (error) {
//     return next(CustomError.createError(error.message, 500));
//   }
// };

// const updateDriver = async (req, res, next) => {
//   try {
//     const { user } = req;
//     const data = Object.fromEntries(
//       Object.entries(req.body).filter(
//         ([_, v]) => v != null && v !== "" && v !== "null"
//       )
//     );

//     const findDriver = await authModel.findOne({ _id: user._id });
//     if (!findDriver) {
//       return next(CustomError.notFound("Driver not found "));
//     }
//     if (req.files.profilePictureUrl) {
//       const profileFile = req.files.profilePictureUrl[0];
//       const profileFileExist = await fileUploadModel.findOne({
//         user: findDriver._id,
//       });

//       console.log(profileFileExist._id, "checking something id");

//       const profileFileUploadModel = await fileUploadModel.findByIdAndUpdate(
//         profileFileExist._id,
//         {
//           file: profileFile.filename,
//           fileType: profileFile.mimetype,
//           user: findDriver._id,
//         },
//         { new: true, upsert: true }
//       );

//       await profileModel.findOneAndUpdate(
//         { userId: findDriver._id },
//         {
//           profilePictureUrl: profileFileUploadModel._id,
//         },
//         { new: true }
//       );

//       await authModel.findOneAndUpdate(
//         { _id: findDriver._id },
//         {
//           image: profileFileUploadModel._id,
//         },
//         { new: true }
//       );
//     }

//     if (req.files.idCardPictureUrl) {
//       const idCardFile = req.files.idCardPictureUrl[0];
//       const idCardFileExist = await fileUploadModel.findOne({
//         user: findDriver._id,
//       });

//       console.log(idCardFileExist._id, "checking something id");

//       const idCardFileUploadModel = await fileUploadModel.findByIdAndUpdate(
//         idCardFileExist._id,
//         {
//           file: idCardFile.filename,
//           fileType: idCardFile.mimetype,
//           user: findDriver._id,
//         },
//         { new: true, upsert: true }
//       );

//       await driverModel.findOneAndUpdate(
//         { userId: findDriver._id },
//         {
//           idCardPictureUrl: idCardFileUploadModel._id,
//         },
//         { new: true }
//       );
//     }

//     if (findDriver.userType !== "driver") {
//       return next(
//         CustomError.forbidden("Only driver can update their profile")
//       );
//     }
//     const findDriverProfile = await profileModel.findOne({
//       userId: findDriver._id,
//     });
//     const profileDatas = await profileModel
//       .findByIdAndUpdate(findDriverProfile._id, data, {
//         new: true,
//       })
//       .populate({
//         path: "userId",
//         select: "_id userType isWalletCreated",
//       })
//       .populate({
//         path: "profilePictureUrl",
//         select: "-_id file",
//       });

//     const findDriverVehicle = await driverModel.findOne({
//       userId: findDriver._id,
//     });
//     const driverData = await driverModel
//       .findByIdAndUpdate(findDriverVehicle._id, data, {
//         new: true,
//       })
//       .populate({
//         path: "idCardPictureUrl",
//         select: "-_id file",
//       }); // const token = await tokenGen(
//     //   { id: findUser._id, userType: findUser.userType },
//     //   "auth",
//     //   data.deviceToken
//     // );

//     // const driverData = {
//     //   ...driverDatas.toObject(),
//     //   email: findDriver.email,
//     // };

//     const profileData = {
//       ...profileDatas.toObject(),
//       email: findDriver.email,
//     };

//     return next(
//       CustomSuccess.createSuccess(
//         { profileData, driverData },
//         "Profile updated successfully",
//         200
//       )
//     );
//   } catch (error) {
//     return next(CustomError.createError(error.message, 500));
//   }
// };

const updateUser = async (req, res, next) => {
  try {
    const { user } = req;
    const data = Object.fromEntries(
      Object.entries(req.body).filter(
        ([_, v]) => v != null && v !== "" && v !== "null"
      )
    );

    const findUser = await authModel.findOne({ _id: user._id });
    if (!findUser) {
      return next(CustomError.notFound("User not found "));
    }
    if (req.files.profilePictureUrl) {
      const file = req.files.profilePictureUrl[0];
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: findUser._id,
      });

      await profileModel.findOneAndUpdate(
        { userId: findUser._id },
        {
          profilePictureUrl: FileUploadModel._id,
        },
        { new: true }
      );

      await authModel.findOneAndUpdate(
        { _id: findUser._id },
        {
          image: FileUploadModel._id,
        },
        { new: true }
      );
    }

    if (findUser.userType !== "user") {
      return next(CustomError.forbidden("Only user can update their profile"));
    }
    const findUserType = await profileModel.findOne({
      userId: findUser._id,
    });
    const profileDatas = await profileModel
      .findByIdAndUpdate(findUserType._id, data, {
        new: true,
      })
      .populate({
        path: "userId",
        select: "_id userType isWalletCreated",
      })
      .populate({
        path: "profilePictureUrl",
        select: "-_id file",
      });

    const profileData = {
      ...profileDatas.toObject(),
      email: findUser.email,
    };

    // const token = await tokenGen(
    //   { id: findUser._id, userType: findUser.userType },
    //   "auth",
    //   data.deviceToken
    // );

    return next(
      CustomSuccess.createSuccess(
        { profileData },
        "Profile updated successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const updateDriver = async (req, res, next) => {
  try {
    const { user } = req;
    const data = Object.fromEntries(
      Object.entries(req.body).filter(
        ([_, v]) => v != null && v !== "" && v !== "null"
      )
    );

    const findDriver = await authModel.findOne({ _id: user._id });
    if (!findDriver) {
      return next(CustomError.notFound("Driver not found "));
    }
    if (req.files.profilePictureUrl) {
      const file = req.files.profilePictureUrl[0];
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: findDriver._id,
      });

      await profileModel.findOneAndUpdate(
        { userId: findDriver._id },
        {
          profilePictureUrl: FileUploadModel._id,
        },
        { new: true }
      );
      await authModel.findOneAndUpdate(
        { _id: findDriver._id },
        {
          image: FileUploadModel._id,
        },
        { new: true }
      );
    }
    if (req.files.idCardPictureUrl) {
      const file = req.files.idCardPictureUrl[0];
      const FileUploadModel = await fileUploadModel.create({
        file: file.filename,
        fileType: file.mimetype,
        user: findDriver._id,
      });

      await driverModel.findOneAndUpdate(
        { userId: findDriver._id },
        {
          idCardPictureUrl: FileUploadModel._id,
        },
        { new: true }
      );
    }

    if (findDriver.userType !== "driver") {
      return next(
        CustomError.forbidden("Only driver can update their profile")
      );
    }
    const findDriverProfile = await profileModel.findOne({
      userId: findDriver._id,
    });
    const profileDatas = await profileModel
      .findByIdAndUpdate(findDriverProfile._id, data, {
        new: true,
      })
      .populate({
        path: "userId",
        select: "_id userType isWalletCreated",
      })
      .populate({
        path: "profilePictureUrl",
        select: "-_id file",
      });

    const findDriverVehicle = await driverModel.findOne({
      userId: findDriver._id,
    });
    const driverData = await driverModel
      .findByIdAndUpdate(findDriverVehicle._id, data, {
        new: true,
      })
      .populate({
        path: "idCardPictureUrl",
        select: "-_id file",
      }); // const token = await tokenGen(
    //   { id: findUser._id, userType: findUser.userType },
    //   "auth",
    //   data.deviceToken
    // );

    // const driverData = {
    //   ...driverDatas.toObject(),
    //   email: findDriver.email,
    // };

    const profileData = {
      ...profileDatas.toObject(),
      email: findDriver.email,
    };

    return next(
      CustomSuccess.createSuccess(
        { profileData, driverData },
        "Profile updated successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const LoginUser = async (req, res, next) => {
  try {
    const { error } = LoginUserValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const { email, password, deviceType, deviceToken } = req.body;
    const AuthModel = await authModel.findOne({ email });
    if (!AuthModel) {
      return next(CustomError.badRequest("User not found"));
    }

    const isPasswordValid = comparePassword(password, AuthModel.password);
    if (!isPasswordValid) {
      return next(CustomError.unauthorized("Email or password is incorrect"));
    }

    const device = await linkUserDevice(AuthModel._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }

    const token = await tokenGen(
      { id: AuthModel._id, userType: AuthModel.userType },
      "auth",
      deviceToken
    );

    // TYPE DISTRIBUTION
    if (AuthModel.userType == "user") {
      const profileDatas = await profileModel
        .findOne({ userId: AuthModel._id })
        .select("-createdAt -updatedAt -__v -_id")
        .populate({
          path: "userId",
          select: "_id userType isWalletCreated",
        })
        .populate({
          path: "profilePictureUrl",
          select: "-_id, file",
        });

      if (!profileDatas) {
        const userData = {
          email: AuthModel.email,
          password: AuthModel.password,
          userType: AuthModel.userType,
        };

        const token = await OtptokenGen({ userData, verified: true });

        return next(
          CustomSuccess.createSuccess(
            { token, userType: AuthModel.userType, profileData: null },
            "Please complete your profile",
            200
          )
        );
      }

      const profileData = {
        ...profileDatas.toObject(),
        email,
      };

      return next(
        CustomSuccess.createSuccess(
          { profileData, token },
          "User logged in successfully",
          200
        )
      );
    } else if (AuthModel.userType == "driver") {
      const profileDatas = await profileModel
        .findOne({
          userId: AuthModel._id,
        })
        .select("-createdAt -updatedAt -__v -_id")
        .populate({
          path: "userId",
          select: "_id userType isWalletCreated",
        })
        .populate({
          path: "profilePictureUrl",
          select: "-_id, file",
        });

      const driverDatas = await driverModel
        .findOne({
          userId: AuthModel._id,
        })
        .select(
          "-createdAt -updatedAt -__v -_id -isApproved -isOnline -isDeleted -rating"
        )
        .populate({
          path: "idCardPictureUrl",
          select: "-_id, file",
        });

      if (!profileDatas && !driverDatas) {
        const userData = {
          email: AuthModel.email,
          password: AuthModel.password,
          userType: AuthModel.userType,
        };

        const token = await OtptokenGen({ userData, verified: true });

        return next(
          CustomSuccess.createSuccess(
            {
              token,
              userType: AuthModel.userType,
              profileData: null,
              driverData: null,
            },
            "Please complete your profile",
            200
          )
        );
      }

      const profileData = {
        ...profileDatas.toObject(),
        email,
      };

      const driverData = {
        ...driverDatas.toObject(),
        email,
      };

      return next(
        CustomSuccess.createSuccess(
          { profileData, driverData, token },
          "Driver logged in successfully",
          200
        )
      );
    }

    return next(
      CustomSuccess.createSuccess(
        { ...AuthModel, token },
        "User logged in successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const { user } = req;
    if (user.userType !== "user") {
      return next(CustomError.forbidden("Only user can see his profile"));
    }

    const profileData = await profileModel
      .findOne({ userId: user._id })
      .populate({
        path: "userId",
        // select: "",
      })
      .populate({
        path: "profilePictureUrl",
        select: "-_id file",
      });

    if (!profileData) {
      return next(CustomError.notFound("User not found"));
    }

    return next(
      CustomSuccess.createSuccess(
        { profileData },
        "User Profile fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const getDriverProfile = async (req, res, next) => {
  try {
    const { user } = req;
    if (user.userType !== "driver") {
      return next(CustomError.forbidden("Only driver can see his profile"));
    }

    const profileData = await profileModel
      .findOne({ userId: user._id })
      .populate({
        path: "profilePictureUrl",
        select: "-_id file",
      });

    const driverData = await driverModel
      .findOne({ userId: user._id })
      .populate({
        path: "userId",
        // select: "",
      })
      .populate({
        path: "idCardPictureUrl",
        select: "-_id file",
      });

    if (!profileData && !driverData) {
      return next(CustomError.notFound("Driver not found"));
    }

    return next(
      CustomSuccess.createSuccess(
        { profileData, driverData },
        "Driver Profile fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const { error } = forgetpasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { email } = req.body;

    const dataExist = await authModel.findOne({
      email: email,
      isDeleted: false,
    });

    if (!dataExist) {
      return next(CustomError.badRequest("User not found"));
    }

    const userName = await profileModel
      .findOne({ userId: dataExist._id })
      .select("-_id firstName");

    let otp = Math.floor(Math.random() * 9000) + 1000;
    let otpExist = await OtpModel.findOne({ auth: dataExist._id });
    if (otpExist) {
      await OtpModel.findOneAndUpdate(
        { auth: dataExist._id },
        {
          otpKey: await bcrypt.hash(otp.toString(), genSalt),
          reason: "forgetPassword",
          otpUsed: false,
          expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
        }
      );
    } else {
      otpExist = await OtpModel.create({
        auth: dataExist._id,
        otpKey: otp,
        reason: "forgetPassword",
        expireAt: new Date(new Date().getTime() + 60 * 60 * 1000),
      });
      await otpExist.save();
    }

    await authModel.findOneAndUpdate({ email }, { otp: otpExist._id });
    const emailData = {
      subject: "City Carriage - Account Verification",
      html: `
  <div
    style = "padding:20px 20px 40px 20px; position: relative; overflow: hidden; width: 100%;"
  >
    <img 
          style="
          top: 0;position: absolute;z-index: 0;width: 100%;height: 100vmax;object-fit: cover;" 
          src="cid:background" alt="background" 
    />
    <div style="z-index:1; position: relative;">
    <header style="padding-bottom: 20px">
      <div class="logo" style="text-align:center;">
        <img 
          style="width: 150px;" 
          src="cid:logo" alt="logo" />
      </div>
    </header>
    <main 
      style= "padding: 20px; background-color: #f5f5f5; border-radius: 10px; width: 80%; margin: 0 auto; margin-bottom: 20px; font-family: 'Poppins', sans-serif;"
    >
      <h1 
        style="color: #FD6F3B; font-size: 30px; font-weight: 700;"
      >Welcome To City Carriage</h1>
      <p
        style="font-size: 24px; text-align: left; font-weight: 500; font-style: italic;"
      >Hi ${userName.firstName},</p>
      <p 
        style="font-size: 20px; text-align: left; font-weight: 500;"
      > Please use the following OTP to reset your password.</p>
      <h2
        style="font-size: 36px; font-weight: 700; padding: 10px; width:100%; text-align:center;color: #FD6F3B; text-align: center; margin-top: 20px; margin-bottom: 20px;"
      >${otp}</h2>
      <p style = "font-size: 16px; font-style:italic; color: #343434">If you did not request this email, kindly ignore this. If this is a frequent occurence <a
      style = "color: #a87628; text-decoration: none; border-bottom: 1px solid #FD6F3B;" href = "#"
      >let us know.</a></p>
      <p style = "font-size: 20px;">Regards,</p>
      <p style = "font-size: 20px;">Dev Team</p>
    </main>
    </div>
  <div>
  `,
      attachments: [
        {
          filename: "logo.png",
          path: "./assets/logo.png",
          cid: "logo",
          contentDisposition: "inline",
        },
      ],
    };
    await sendEmails(
      email,
      emailData.subject,
      emailData.html,
      emailData.attachments
    );
    const token = await tokenGen(
      { id: dataExist._id, userType: dataExist.userType },
      "forgetPassword"
    );

    return next(
      CustomSuccess.createSuccess(
        { token, otp },
        "OTP sent to registered email",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const VerifyOtp = async (req, res, next) => {
  try {
    if (req.user.tokenType != "forgetPassword") {
      return next(
        CustomError.createError("Token type is not forgot password", 200)
      );
    }

    const { error } = verifyOTPValidator.validate(req.body);
    if (error) {
      error.details.map((err) => {
        next(CustomError.createError(err.message, 200));
      });
    }

    const { otp, deviceToken, deviceType } = req.body;
    const { email } = req.user;

    const user = await authModel.findOne({ email }).populate(["otp"]);
    if (!user) {
      return next(CustomError.createError("User not found", 200));
    }
    const OTP = user.otp;
    if (!OTP || OTP.otpUsed) {
      return next(CustomError.createError("OTP not found", 200));
    }

    const userOTP = await bcrypt.hash(otp, genSalt);

    if (OTP.otpKey !== userOTP) {
      return next(CustomError.createError("Invalid OTP", 401));
    }

    const currentTime = new Date();
    const OTPTime = OTP.updatedAt;
    const diff = currentTime.getTime() - OTPTime.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes > 60) {
      return next(CustomError.createError("OTP expired", 200));
    }
    const device = await linkUserDevice(user._id, deviceToken, deviceType);
    if (device.error) {
      return next(CustomError.createError(device.error, 200));
    }
    const token = await tokenGen(user, "verify otp", deviceToken);

    const bulkOps = [];
    const update = { otpUsed: true, otpKey: null };
    // let  userUpdate ;
    if (OTP._doc.reason !== "forgetPassword") {
      bulkOps.push({
        deleteOne: {
          filter: { _id: OTP._id },
        },
      });
      // userUpdate.OTP = null;
    } else {
      bulkOps.push({
        updateOne: {
          filter: { _id: OTP._id },
          update: { $set: update },
        },
      });
    }
    OtpModel.bulkWrite(bulkOps);
    // AuthModel.updateOne({ identifier: user.identifier }, { $set: userUpdate });
    // user.profile._doc.userType = user.userType;
    // const profile = { ...user.profile._doc, token };
    // delete profile.auth;

    return next(
      CustomSuccess.createSuccess(
        { ...user._doc, token },
        "OTP verified successfully",
        200
      )
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("otp not verify", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { error } = changePasswordValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }

    const { user } = req;
    const { old_password, new_password } = req.body;

    const AuthModel = await authModel.findOne({ _id: user._id });
    if (!AuthModel) {
      return next(CustomError.badRequest("User not found"));
    }

    const isMatch = comparePassword(old_password, AuthModel.password);
    if (!isMatch) {
      return next(CustomError.badRequest("Old Password is Incorrect"));
    }

    AuthModel.password = hashPassword(new_password);
    await AuthModel.save();

    return next(
      CustomSuccess.createSuccess({}, "Password Changed Successfully", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const resetpassword = async (req, res, next) => {
  try {
    if (req.user.tokenType != "verify otp") {
      return next(
        CustomError.createError("First verify otp then reset password", 200)
      );
    }
    const { error } = ResetPasswordValidator.validate(req.body);

    if (error) {
      error.details.map((err) => {
        next(err.message, 200);
      });
    }

    // const { devicetoken } = req.headers;

    const { email } = req.user;
    // if (req.user.devices[req.user.devices.length - 1].deviceToken != devicetoken) {
    //   return next(CustomError.createError("Invalid device access", 200));
    // }

    const updateuser = await authModel.findOneAndUpdate(
      { email },
      {
        password: await bcrypt.hash(req.body.password, genSalt),
        otp: null,
      },
      { new: true }
    );

    // if (!updateuser) {
    //   return next(CustomError.createError("password not reset", 200));
    // }

    const user = await authModel.findOne({ email });
    const token = await tokenGen(user, "auth", req.body.deviceToken);

    const profile = { ...user._doc, token };
    delete profile.password;

    return next(
      CustomSuccess.createSuccess(profile, "Password reset succesfully", 200)
    );
  } catch (error) {
    if (error.code === 11000) {
      return next(CustomError.createError("code not send", 200));
    }
    return next(CustomError.createError(error.message, 200));
  }
};

const logout = async (req, res, next) => {
  try {
    const { user } = req;
    const { deviceType, deviceToken } = req.body;
    if (!user) {
      return next(CustomError.notFound("User not found"));
    }

    unlinkUserDevice(user._id, deviceToken, deviceType);

    return next(
      CustomSuccess.createSuccess({}, "User logout successfully", 200)
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 200));
  }
};

const likeDriver = async (req, res, next) => {
  try {
    const { driverId } = req.body;
    const findDriver = await driverModel.findOne({ _id: driverId });
    if (!findDriver) {
      return next(CustomError.notFound("Driver not found"));
    }

    const existingLiked = await favouriteModel.findOne({
      driverId,
      userId: req.user._id,
    });

    if (existingLiked) {
      await favouriteModel.findOneAndRemove({
        driverId,
        userId: req.user._id,
      });
      return next(
        CustomSuccess.createSuccess(
          { isLiked: false },
          "Favourite Removed Successfully",
          200
        )
      );
    } else {
      const favorite = new favouriteModel({
        driverId,
        userId: req.user._id,
        isLiked: true,
      });
      await favorite.save();
      return next(
        CustomSuccess.createSuccess(
          { isLiked: true },
          "Favourite Liked successfully",
          200
        )
      );
    }
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const getLikedDrivers = async (req, res, next) => {
  try {
    const { user } = req;

    const likedDrivers = await favouriteModel.aggregate([
      {
        $match: { userId: user._id },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "driverId",
          foreignField: "_id",
          as: "driver",
        },
      },
      {
        $unwind: {
          path: "$driver",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "driver.userId",
          foreignField: "userId",
          as: "profile",
        },
      },
      {
        $unwind: {
          path: "$profile",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "fileuploads",
          localField: "profile.profilePictureUrl",
          foreignField: "_id",
          as: "image",
        },
      },
      {
        $unwind: {
          path: "$image",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          isLiked: 1,
          "driver.rating": 1,
          "image.file": 1,
          "profile.firstName": 1,
          "profile.lastName": 1,
        },
      },
      {
        $addFields: {
          image: "$image.file",
          firstName: "$profile.firstName",
          lastName: "$profile.lastName",
          rating: "$driver.rating",
        },
      },
      {
        $project: {
          _id: 1,
          isLiked: 1,
          image: "$image.file",
          firstName: "$profile.firstName",
          lastName: "$profile.lastName",
          rating: "$driver.rating",
        },
      },
    ]);

    return next(
      CustomSuccess.createSuccess(
        { likedDrivers },
        "Liked drivers fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const AuthController = {
  completeDriverProfile: [
    handleMultipartData.fields([
      { name: "profilePictureUrl", maxCount: 1 },
      { name: "idCardPictureUrl", maxCount: 1 },
    ]),
    completeDriverProfile,
  ],

  completeUserProfile: [
    handleMultipartData.fields([{ name: "profilePictureUrl", maxCount: 1 }]),
    completeUserProfile,
  ],

  updateUser: [
    handleMultipartData.fields([{ name: "profilePictureUrl", maxCount: 1 }]),
    updateUser,
  ],

  updateDriver: [
    handleMultipartData.fields([
      { name: "profilePictureUrl", maxCount: 1 },
      { name: "idCardPictureUrl", maxCount: 1 },
    ]),
    updateDriver,
  ],

  createProfile,
  verifyProfile,
  LoginUser,
  getUserProfile,
  getDriverProfile,
  forgetPassword,
  VerifyOtp,
  resetpassword,
  logout,
  userSocialLogin,
  changePassword,
  likeDriver,
  getLikedDrivers,
};

export default AuthController;
