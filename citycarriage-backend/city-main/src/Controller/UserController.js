import ContactFormModel from "../DB/Model/contactFormModel.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import { formValidator } from "../Utils/Validator/UserValidator.js";

const createContactForm = async (req, res, next) => {
  try {
    const { error } = formValidator.validate(req.body);
    if (error) {
      return next(CustomError.badRequest(error.details[0].message));
    }
    const { user } = req;
    const contactForm = new ContactFormModel({
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone,
      message: req.body.message,
      user: user._id,
    });

    await contactForm.save();

    return next(
      CustomSuccess.createSuccess(
        { contactForm },
        "Form Submitted Successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const viewContactForm = async (req, res, next) => {
  try {
    //console.log(req.user._id);
    const contactform = await ContactFormModel.find({});
    return next(
      CustomSuccess.createSuccess(contactform, "Form Get Successfully", 200)
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const viewContactFormbyUID = async (req, res, next) => {
  try {
    const userId = req.params.id; // Assuming req.user contains the user object with the ObjectId

    const contactForms = await ContactFormModel.find({ user: userId });

    if (!contactForms) {
      return next(
        CustomError.createError("No contact forms found for the user", 404)
      );
    }

    return next(
      CustomSuccess.createSuccess(
        contactForms,
        "Contact forms retrieved successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const viewContactFormbyMonth = async (req, res, next) => {
  try {
    const month = req.body.month; // Assuming the month is provided as a query parameter

    const contactForms = await ContactFormModel.find({
      createdAt: {
        $gte: new Date(month),
        $lt: new Date(month).setMonth(new Date(month).getMonth() + 1),
      },
    });

    if (!contactForms) {
      return next(
        CustomError.createError(
          "No contact forms found for the specified month",
          404
        )
      );
    }

    return next(
      CustomSuccess.createSuccess(
        contactForms,
        "Contact forms retrieved successfully",
        200
      )
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const deleteContactForm = async (req, res, next) => {
  try {
    const content = await ContactFormModel.findByIdAndRemove(req.params.id);
    if (!content) {
      return next(
        CustomError.createError(
          "Contact Form not found or you are not authorized to delete this Form",
          404
        )
      );
    }
    return next(
      CustomSuccess.createSuccess({}, "Contact Form deleted successfully", 200)
    );
  } catch (err) {
    return next(CustomError.badRequest("Content ID is invalid"));
  }
};

const UserController = {
  createContactForm,
  viewContactForm,
  viewContactFormbyUID,
  viewContactFormbyMonth,
  deleteContactForm,
};

export default UserController;
