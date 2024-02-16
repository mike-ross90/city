import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
import Wallet from "../DB/Model/Payments/wallets.js";
import profileModel from "../DB/Model/profileModel.js";
import RideModel from "../DB/Model/rideModel.js";
import { Types } from "mongoose";

function calculateRideCost(
  distance,
  minutes,
  // driver,
  timeOfDay,
  dayOfWeek,
  isHoliday
) {
  const rideOnlyBaseRate = 1.45;
  const rideOnlyMinuteRate = 2.25;
  const weekendRate = 0.02;
  const holidayRate = 0.2;
  let baseCost = 0;

  baseCost = Math.max(10, rideOnlyBaseRate * distance);
  // Calculate the cost based on time
  const timeCost = rideOnlyMinuteRate * minutes;

  // Calculate the time of day, weekend, and holiday charges
  let timeOfDayCharge = 0;
  // if (timeOfDay >= 21 || timeOfDay < 6) {
  //   timeOfDayCharge = baseCost * lateNightRate;
  // }
  if (dayOfWeek >= 5 && timeOfDay >= 18) {
    timeOfDayCharge = baseCost * weekendRate;
  }
  if (isHoliday) {
    timeOfDayCharge = baseCost * holidayRate;
  }

  // Calculate the total cost
  const totalCost = baseCost + timeCost + timeOfDayCharge;

  // Calculate your share based on the total cost
  let yourShare = 0;
  if (totalCost < 40) {
    yourShare = totalCost * 0.23;
  } else if (totalCost >= 40 && totalCost <= 70) {
    yourShare = totalCost * 0.32;
  } else {
    yourShare = totalCost * 0.43;
  }

  return {
    baseCost,
    timeCost,
    timeOfDayCharge,
    totalCost,
    yourShare,
  };
}

// function calculateRideCost(
//   distance,
//   minutes,
//   chaperone,
//   timeOfDay,
//   dayOfWeek,
//   isHoliday
// ) {
//   const rideOnlyBaseRate = 1.45;
//   const rideOnlyMinuteRate = 2.25;
//   const chaperoneRate = 27;
//   const wheelchairChaperoneRate = 39;
//   const chaperoneMinimumHours = 1;
//   const chaperoneMinimumCharge = 37;
//   const wheelchairMinimumCharge = 54;
//   const additionalPersonRate = 0.2;
//   const lateNightRate = 0.05;
//   const weekendRate = 0.02;
//   const holidayRate = 0.2;

//   // Calculate the base cost for the ride
//   let baseCost = 0;
//   if (chaperone) {
//     if (distance === 0) {
//       baseCost = chaperoneMinimumCharge;
//     } else if (distance < 15) {
//       baseCost = 10 + chaperoneMinimumHours * chaperoneRate;
//     } else {
//       baseCost = wheelchairMinimumCharge;
//     }
//   } else {
//     baseCost = Math.max(10, rideOnlyBaseRate * distance);
//   }

//   // Calculate the cost based on time
//   const timeCost = rideOnlyMinuteRate * minutes;

//   // Calculate the additional person charge
//   const additionalPersonCharge = chaperone
//     ? 0
//     : additionalPersonRate * (chaperone ? baseCost : baseCost - 10);

//   // Calculate the time of day, weekend, and holiday charges
//   let timeOfDayCharge = 0;
//   if (timeOfDay >= 21 || timeOfDay < 6) {
//     timeOfDayCharge = baseCost * lateNightRate;
//   }
//   if (dayOfWeek >= 5 && timeOfDay >= 18) {
//     timeOfDayCharge = baseCost * weekendRate;
//   }
//   if (isHoliday) {
//     timeOfDayCharge = baseCost * holidayRate;
//   }

//   // Calculate the total cost
//   const totalCost =
//     baseCost + timeCost + additionalPersonCharge + timeOfDayCharge;

//   // Calculate your share based on the total cost
//   let yourShare = 0;
//   if (totalCost < 40) {
//     yourShare = totalCost * 0.23;
//   } else if (totalCost >= 40 && totalCost <= 70) {
//     yourShare = totalCost * 0.32;
//   } else {
//     yourShare = totalCost * 0.43;
//   }

//   return {
//     baseCost,
//     timeCost,
//     additionalPersonCharge,
//     timeOfDayCharge,
//     totalCost,
//     yourShare,
//   };
// }

const distanceFareCalculator = async (req, res, next) => {
  const currentTime = new Date();
  const timeOfDay = currentTime.getHours();
  const isHoliday = false;
  const dayOfWeek = currentTime.getDay();
  try {
    const { rideDistance, rideMinutes } = req.body;
    const rideCost = calculateRideCost(
      rideDistance,
      rideMinutes,
      timeOfDay,
      dayOfWeek,
      isHoliday
    );
    console.log(rideCost);
    return next(
      CustomSuccess.createSuccess(
        { estCost: rideCost.totalCost },
        "Fare calculated Successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const preBookRide = async (req, res, next) => {
  try {
    const {
      from,
      destination,
      type,
      additionalDetails,
      pre_aboutToday,
      pre_preferredPlace,
      pre_time,
      pre_date,
      estFare,
      distance,
    } = req.body;
    const { user } = req;

    //Distance Calculation from backend :)

    // Warning !! Don't uncomment if unless you have to ...

    // const x1 = from.long
    // const x2 = destination.long
    // const y1= from.lat
    // const y2 = destination.lat

    // const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2)

    const getWallet = await Wallet.findOne({ userId: user._id });
    if (!getWallet) {
      return next(CustomError.badRequest("You don't have any wallet"));
    }
    if (getWallet.amount <= estFare) {
      return next(CustomError.badRequest("Insufficient Balance in wallet"));
    }

    const findPreBook = await RideModel.find({
      creator: user._id,
      status: { $nin: ["completed", "rejected"] },
    });
    console.log("FINED PRRRRE BOOOOOOOOK", findPreBook);
    if (findPreBook.length != 0) {
      return next(CustomError.badRequest("Pre-Book Ride Already Created"));
    }

    const preBookRide = new RideModel({
      mode: "pre",
      from,
      destination,
      type,
      additionalDetails,
      pre_aboutToday,
      pre_preferredPlace,
      pre_time,
      pre_date,
      estFare,
      distance,
      //  distance:distance*100,
      creator: user._id,
      location: { coordinates: [from.lat, from.long] },
    });

    await preBookRide.save();

    setTimeout(async () => {
      const rideToCheck = await RideModel.findById(preBookRide._id);
      if (rideToCheck && rideToCheck.status === "pending") {
        // If the ride is still pending, delete it
        await RideModel.findByIdAndDelete(rideToCheck._id);
        console.log(`Ride ID ${rideToCheck._id} deleted after 1 minutes`);
      }
    }, 100000);

    return next(
      CustomSuccess.createSuccess(preBookRide, "Ride Created Successfully", 200)
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const instantRideBook = async (req, res, next) => {
  try {
    // const { from, destination, type, additionalDetails, estFare, distance } =
    //   req.body
    const { from, destination, estFare, distance } = req.body;
    const { user } = req;

    const getWallet = await Wallet.findOne({ userId: user._id });
    if (!getWallet) {
      return next(CustomError.badRequest("You don't have any wallet"));
    }
    if (getWallet.amount <= estFare) {
      return next(CustomError.badRequest("Insufficient balance in wallet"));
    }

    const instantRideBook = await RideModel.create({
      creator: user._id,
      from,
      destination,
      estFare,
      distance,
      location: { coordinates: [from.lat, from.long] },
    });

    setTimeout(async () => {
      const rideToCheck = await RideModel.findById(instantRideBook._id);
      if (rideToCheck && rideToCheck.status === "pending") {
        await RideModel.findByIdAndDelete(rideToCheck._id);
        console.log(`Ride ID ${rideToCheck._id} deleted after 1 minutes`);
      }
    }, 60000);

    return next(
      CustomSuccess.createSuccess(
        instantRideBook,
        "Ride created successfully",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const GetSinglepreBookRidebyUser = async (req, res, next) => {
  try {
    const { user } = req;
    const RideDetails = await RideModel.findOne({ creator: user._id }).sort({
      _id: -1,
    });

    return next(
      CustomSuccess.createSuccess(RideDetails, "Ride Details Successfully", 200)
    );
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const GetAllpreBookRidebyUser = async (req, res, next) => {
  try {
    const { user } = req;

    if (user.userType === "user") {
      const RideDetails = await RideModel.find({
        creator: user._id,
        mode: "pre",
        status: { $nin: ["completed", "rejected"] },
      })
        .populate({
          path: "creator",
          populate: {
            path: "image",
          },
        })
        .populate({
          path: "acceptedBy",
          populate: {
            path: "image",
          },
        })
        .sort({ _id: -1 });

      return next(
        CustomSuccess.createSuccess(
          RideDetails,
          "Ride Details Successfully",
          200
        )
      );
    } else if (user.userType === "chaperone") {
      const RideDetails = await RideModel.find({
        acceptedBy: user._id,
        mode: "pre",
        status: { $nin: ["completed", "rejected"] },
      })
        .populate({
          path: "creator",
          populate: {
            path: "image",
          },
        })
        .populate({
          path: "acceptedBy",
          populate: {
            path: "image",
          },
        })
        .sort({ _id: -1 });

      return next(
        CustomSuccess.createSuccess(
          RideDetails,
          "Ride Details Successfully",
          200
        )
      );
    }
  } catch (error) {
    next(CustomError.createError(error.message, 500));
  }
};

const GetRideHisory = async (req, res, next) => {
  try {
    const { user } = req;

    if (user.userType === "user") {
      const rideHistory = await RideModel.aggregate([
        {
          $match: {
            creator: user._id,
            status: { $in: ["completed", "cancelled"] },
          },
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "acceptedBy",
            foreignField: "user",
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
          $lookup: {
            from: "profiles",
            localField: "image.user",
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
          $sort: {
            "image.createdAt": -1,
          },
        },
        {
          $group: {
            _id: "$_id",
            status: { $first: "$status" },
            distance: { $first: "$distance" },
            from: { $first: "$from" },
            destination: { $first: "$destination" },
            estFare: { $first: "$estFare" },
            createdAt: { $first: "$createdAt" },
            image: { $first: "$image.file" },
            firstName: { $first: "$profile.firstName" },
            lastName: { $first: "$profile.lastName" },
          },
        },
      ]);

      if (rideHistory) {
        return next(
          CustomSuccess.createSuccess(
            { rideHistory },
            "User ride history fetched successfully",
            200
          )
        );
      }
      return next(
        CustomSuccess.createSuccess(
          { rideHistory },
          "No rides found for this user",
          200
        )
      );
    } else if (user.userType === "driver") {
      const rideHistory = await RideModel.aggregate([
        {
          $match: {
            acceptedBy: user._id,
            status: { $in: ["completed", "cancelled"] },
          },
        },
        {
          $lookup: {
            from: "fileuploads",
            localField: "creator",
            foreignField: "user",
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
          $lookup: {
            from: "profiles",
            localField: "image.user",
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
          $sort: {
            "image.createdAt": -1,
          },
        },
        {
          $group: {
            _id: "$_id",
            status: { $first: "$status" },
            distance: { $first: "$distance" },
            from: { $first: "$from" },
            destination: { $first: "$destination" },
            estFare: { $first: "$estFare" },
            createdAt: { $first: "$createdAt" },
            image: { $first: "$image.file" },
            firstName: { $first: "$profile.firstName" },
            lastName: { $first: "$profile.lastName" },
          },
        },
      ]);

      if (rideHistory) {
        return next(
          CustomSuccess.createSuccess(
            { rideHistory },
            "Driver ride history fetched successfully",
            200
          )
        );
      }
      return next(
        CustomSuccess.createSuccess(
          { rideHistory },
          "No rides found for this driver",
          200
        )
      );
    }
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const GetSavedLocations = async (req, res, next) => {
  try {
    const { user } = req;

    const savedPlaces = await RideModel.find({
      creator: user._id,
      status: { $in: ["completed"] },
    })
      .select("destination _id")
      .sort({ createdAt: -1 })
      .limit(2);

    if (savedPlaces) {
      return next(
        CustomSuccess.createSuccess(
          { savedPlaces },
          "Saved locations fetched successfully",
          200
        )
      );
    }

    return next(
      CustomError.createSuccess(
        { savedPlaces },
        "No saved locations found",
        200
      )
    );
  } catch (error) {
    return next(CustomError.createError(error.message, 500));
  }
};

const RideController = {
  distanceFareCalculator,
  instantRideBook,
  GetRideHisory,
  GetSavedLocations,
  preBookRide,
  GetSinglepreBookRidebyUser,
  GetAllpreBookRidebyUser,
};

export default RideController;
