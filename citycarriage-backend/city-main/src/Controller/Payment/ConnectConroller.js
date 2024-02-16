import Stripe from "stripe";
import authModel from "../../DB/Model/authModel.js";
import connectedAccount from "../../DB/Model/Payments/connectAccounts.js";
import driverWallet from "../../DB/Model/Payments/driverWallets.js";
import CustomSuccess from "../../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../../Utils/ResponseHandler/CustomError.js";
import dotenv from "dotenv";
dotenv.config();

const STRIPEKEY = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(STRIPEKEY);
const createStripeAccount = async (req, res, next) => {
  try {
    console.log(STRIPEKEY);
    const { user } = req;
    const firstName = "testFullName";
    const lastName = "testLastName";
    const supportEmail = "support@thesuitch.com";
    const supportUrl = "thesuitch.com";

    const {
      country,
      email,
      mcc,
      city,
      AddressOne,
      AddressTwo,
      PostalCode,
      state,
      taxId,
      ssnLast4Digit,
      idNumber,
      maidenName,
      //DOB
      day,
      month,
      year,
      Postal_code,
      //Business
      businessName,
      businessPhone,
      accountNumber,
      accountCurrency,
      routingNumber,
    } = req.body;
    const fetchAccount = await connectedAccount.findOne({
      userId: user._id,
    });
    if (fetchAccount) {
      return res.status(400).send({
        success: false,
        message: "You have Already Created an Account",
      });
    }
    let account;
    if (req.body.country === "US") {
      account = await stripe.accounts.create({
        type: "custom",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: mcc,
          name: businessName,
          support_email: supportEmail,
          support_phone: businessPhone,
          support_url: supportUrl,
          url: supportUrl,
          support_address: {
            country: country,
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
            state: state,
          },
        },
        business_type: "individual",
        company: {
          tax_id: taxId,
          name: businessName,
          phone: businessPhone,
          address: {
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
            state: state,
          },
        },
        individual: {
          address: {
            city: city,
            state: state,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
          },
          ssn_last_4: ssnLast4Digit,
          id_number: idNumber,
          verification: {
            additional_document: {
              front: "file_identity_document_success",
            },
            document: {
              front: "file_identity_document_success",
            },
          },
          dob: {
            day,
            month,
            year,
          },
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          maiden_name: maidenName,
          phone: businessPhone,
          registered_address: {
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: req.body.Postal_code,
          },
        },
        external_account: {
          account_number: accountNumber,
          object: "bank_account",
          country: country,
          currency: accountCurrency,
          routing_number: routingNumber,
        },

        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.connection.remoteAddress,
        },
      });
    } else {
      account = await stripe.accounts.create({
        type: "custom",
        country: country,
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: mcc,
          name: businessName,
          support_email: supportEmail,
          support_phone: businessPhone,
          support_url: supportUrl,
          url: supportUrl,
          support_address: {
            country: country,
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
            state: state,
          },
        },
        business_type: "individual",
        company: {
          tax_id: taxId,
          name: businessName,
          phone: businessPhone,
          address: {
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
            state: state,
          },
        },
        individual: {
          address: {
            city: city,
            state: state,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: PostalCode,
          },
          id_number: idNumber,
          verification: {
            additional_document: {
              front: "file_identity_document_success",
            },
            document: {
              front: "file_identity_document_success",
            },
          },
          dob: {
            day,
            month,
            year,
          },
          email: user.email,
          first_name: firstName,
          last_name: lastName,
          maiden_name: maidenName,
          phone: businessPhone,
          registered_address: {
            city: city,
            line1: AddressOne,
            line2: AddressTwo,
            postal_code: Postal_code,
          },
        },
        external_account: {
          account_number: accountNumber,
          object: "bank_account",
          country: country,
          currency: accountCurrency,
          //routing_number: routingNumber,
        },

        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.connection.remoteAddress,
        },
      });
    }

    const insertAccount = new connectedAccount({
      userId: user._id,
      connectAccountId: account.id,
      accountNumberLast4Digit: account.external_accounts.data[0].last4,
      businessName: businessName,
    });

    await insertAccount.save();

    const DriverWallet = await driverWallet.create({
      userId: user._id,
      connectAccountId: account.id,
    });

    if (!DriverWallet) {
      return next(CustomError.badRequest("Can't Create Wallet"));
    }
    await authModel.findByIdAndUpdate(
      user._id,
      { isWalletCreated: true },
      { new: true }
    );

    return next(CustomSuccess.createSuccess({ account }, account.message, 200));
  } catch (e) {
    console.log("the error", e);
    return next(CustomError.badRequest(e.message));
  }
};
//

const getDriverAccount = async (req, res, next) => {
  try {
    const { user } = req;
    const fetchConnectAccount = await connectedAccount.findOne({
      userId: user._id,
    });
    if (!fetchConnectAccount) {
      return next(
        CustomError.notFound("Connect account for this user does not exist")
      );
    }

    return next(
      CustomSuccess.createSuccess(
        fetchConnectAccount,
        "Driver connect account fetched successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

// const getDriverAccount = async (req, res, next) => {
//   try {
//     const { user } = req;
//     const fetchConnectAccount = await connectedAccount.findOne({
//       userId: user._id,
//     });
//     if (!fetchConnectAccount) {
//       return res.status(400).send({
//         success: false,
//         message: "You Do not have Account",
//       });
//     }

//     return res.status(200).send({
//       success: true,
//       message: "Your Account Details fetch Successfully",
//       data: fetchConnectAccount,
//     });
//   } catch (e) {
//     console.log(e);
//     return res.status(400).send(e);
//   }
// };

const connectController = {
  createStripeAccount,
  getDriverAccount,
};

export default connectController;
