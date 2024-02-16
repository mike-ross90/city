import authModel from "../DB/Model/authModel.js";
import ContentModel from "../DB/Model/contentModal.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { comparePassword, hashPassword } from "../Utils/SecuringPassword.js";
import { sendEmails } from "../Utils/SendEmail.js";

import {
  IdValidator,
  RegisterUserValidator,
} from "../Utils/Validator/UserValidator.js";
import {
  designationValidator,
  notificationValidator,
} from "../Utils/Validator/adminvalidator.js";

import push_notifications from "../Config/push_notification.js";
// import userModel from "../DB/Model/userModel.js";
import chaperoneModel from "../DB/Model/chaperoneModel.js";
import faqModel from "../DB/Model/faqModel.js";

// Post Controllers for updating and creating App Content data
const postAbout = async (req, res, next) => {
  try {
    const existingItem = await ContentModel.findOne({ contentType: "about" });
    const { contentType, title } = req.body;
    if (existingItem) {
      const updatedResult = await ContentModel.findOneAndUpdate(
        { contentType: "about" },
        { title: title },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedResult,
      });
    } else {
      const aboutContent = new ContentModel({ contentType, title });
      const result = await aboutContent.save();
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update about content",
      error: err.message,
    });
  }
};

const postTerms = async (req, res, next) => {
  try {
    const existingItem = await ContentModel.findOne({ contentType: "terms" });
    const { contentType, title } = req.body;
    if (existingItem) {
      const updatedResult = await ContentModel.findOneAndUpdate(
        { contentType: "terms" },
        { title: title },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedResult,
      });
    } else {
      const termsContent = new ContentModel({ contentType, title });
      const result = await termsContent.save();
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update terms content",
      error: err.message,
    });
  }
};

const postPrivacy = async (req, res, next) => {
  try {
    const existingItem = await ContentModel.findOne({ contentType: "privacy" });
    const { contentType, title } = req.body;
    if (existingItem) {
      const updatedResult = await ContentModel.findOneAndUpdate(
        { contentType: "privacy" },
        { title: title },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedResult,
      });
    } else {
      const privacyContent = new ContentModel({ contentType, title });
      const result = await privacyContent.save();
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update privacy content",
      error: err.message,
    });
  }
};

const PostFaq = async (req, res, next) => {
  try {
    const existingItem = await faqModel.findOne({ contentType: "faq" });
    const { contentType, item } = req.body;
    if (existingItem) {
      const updatedResult = await faqModel.findOneAndUpdate(
        { contentType: "faq" },
        { item },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        data: updatedResult,
      });
    } else {
      const aboutContent = new faqModel({ contentType, item });
      const result = await aboutContent.save();
      return res.status(200).json({
        success: true,
        data: result,
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update about content",
      error: err.message,
    });
  }
};

//// Get Controllers for getting App Content data
const getAbout = async (req, res, next) => {
  try {
    const result = await ContentModel.findOne({ contentType: "about" });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update about content",
      error: err.message,
    });
  }
};

const getTerms = async (req, res, next) => {
  try {
    const result = await ContentModel.findOne({ contentType: "terms" });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update terms content",
      error: err.message,
    });
  }
};

const getPrivacy = async (req, res, next) => {
  try {
    const result = await ContentModel.findOne({ contentType: "privacy" });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update privacy content",
      error: err.message,
    });
  }
};

const getFaq = async (req, res, next) => {
  try {
    const result = await faqModel.findOne({ contentType: "faq" });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update privacy content",
      error: err.message,
    });
  }
};

//// Delete Controllers for Deleting App Content data
const deleteAbout = async (req, res, next) => {
  try {
    const result = await ContentModel.findOneAndDelete(
      { contentType: "about" },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete about content",
      error: err.message,
    });
  }
};

const deleteTerms = async (req, res, next) => {
  try {
    const result = await ContentModel.findOneAndDelete(
      { contentType: "terms" },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete about content",
      error: err.message,
    });
  }
};

const deletePrivacy = async (req, res, next) => {
  try {
    const result = await ContentModel.findOneAndDelete(
      { contentType: "privacy" },
      { new: true }
    );
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete about content",
      error: err.message,
    });
  }
};

/////////////

const SendNotification = async (req, res, next) => {
  try {
    const { error } = notificationValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { userId, allUser, title, body } = req.body;
    var data = [];
    if (allUser) {
      data = [...(await authModel.find({}).populate("devices"))];
    } else {
      data = [
        ...(await authModel.find({ _id: { $in: userId } }).populate("devices")),
      ];
    }
    console.log(data);
    data.map((item) => {
      item.devices.map(async (item2) => {
        await push_notifications({
          deviceToken: item2.deviceToken,
          title,
          body,
        });
      });
    });
    return next(
      CustomSuccess.createSuccess({}, "Notification Sent successfully", 200)
    );
  } catch (error) {
    return next(CustomError.badRequest(error.message));
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Update the fields: isDeleted = true, notificationOn = false
    const updatedUser = await authModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        notificationOn: false,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    // Handle the error
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    // Define the page limit and calculate the number of documents to skip
    const LIMIT = limit; // Change this to your desired page limit
    const skip = (Number(page) - 1) * LIMIT;

    // Retrieve all users excluding the password field with pagination
    const users = await userModel
      .find()
      .populate("user")
      .select("-password")
      .skip(skip)
      .limit(LIMIT);

    // Calculate the total number of pages
    const totalUsers = await userModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / LIMIT);

    return res.status(200).json({
      status: true,
      data: users,
      total_pages: totalPages,
      current_page: parseInt(page),
    });
  } catch (error) {
    return next(error);
  }
};

const getAllChaperones = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    // Define the page limit and calculate the number of documents to skip
    const LIMIT = limit; // Change this to your desired page limit
    const skip = (Number(page) - 1) * LIMIT;

    // Retrieve all users excluding the password field with pagination
    const users = await chaperoneModel
      .find()
      .populate("user")
      .select("-password")
      .skip(skip)
      .limit(LIMIT);

    // Calculate the total number of pages
    const totalUsers = await chaperoneModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / LIMIT);

    return res.status(200).json({
      status: true,
      data: users,
      total_pages: totalPages,
      current_page: parseInt(page),
    });
  } catch (error) {
    return next(error);
  }
};

const updateDriverStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // Update the fields: isDeleted = true, notificationOn = false
    const updatedUser = await chaperoneModel.findByIdAndUpdate(
      id,
      {
        isApproved: status,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    // Handle the error
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

const AdminController = {
  getAllUsers,
  deleteUser,
  SendNotification,
  postAbout,
  postTerms,
  postPrivacy,
  getAbout,
  getTerms,
  getPrivacy,
  deleteAbout,
  deleteTerms,
  deletePrivacy,
  getAllChaperones,
  PostFaq,
  getFaq,
  updateDriverStatus,
};

export default AdminController;
