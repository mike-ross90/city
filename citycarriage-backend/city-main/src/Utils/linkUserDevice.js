import authModel from "../DB/Model/authModel.js";
import DeviceModel from "../DB/Model/deviceModel.js";
import CustomError from "../Utils/ResponseHandler/CustomError.js";
// import CustomSuccess from "../Utils/ResponseHandler/CustomSuccess.js";

export const linkUserDevice = async (authId, deviceToken, deviceType) => {
  if (
    !authId ||
    !deviceToken ||
    !deviceType ||
    typeof deviceToken !== "string" ||
    typeof deviceType !== "string"
  ) {
    return { error: "Invalid arguments" };
  }

  try {
    const existingDevice = await DeviceModel.findOne({
      deviceToken,
      user: { $ne: authId },
    });

    if (existingDevice) {
      await authModel.findByIdAndUpdate(existingDevice.user, {
        $pull: { devices: existingDevice._id },
        $addToSet: { loggedOutDevices: existingDevice._id },
      });
    }

    const device = await DeviceModel.findOneAndUpdate(
      {
        deviceToken,
      },
      {
        $set: {
          deviceType,
          user: authId,
          $setOnInsert: { createdAt: new Date() },
          status: "active",
          lastSeen: new Date(),
          deviceToken,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
    await authModel.findByIdAndUpdate(authId, {
      $addToSet: { devices: device._id },
      $pull: { loggedOutDevices: device._id },
    });
    return { device };
  } catch (error) {
    return next(CustomError.internal("Error while linking device"));
  }
};

export const unlinkUserDevice = async (authId, deviceToken, deviceType) => {
  if (
    !authId ||
    !deviceToken ||
    !deviceType ||
    typeof deviceToken !== "string" ||
    typeof deviceType !== "string"
  ) {
    return { error: "Invalid arguments" };
  }
  try {
    const existingDevice = await DeviceModel.findOne({
      deviceToken,
      user: authId,
    });

    if (existingDevice) {
      await authModel.findByIdAndUpdate(existingDevice.user, {
        $pull: { devices: existingDevice._id },
        $addToSet: { loggedOutDevices: existingDevice._id },
      });

      await DeviceModel.findOneAndUpdate(
        {
          deviceToken,
        },
        {
          status: "disactive",
          lastSeen: new Date(),
        }
      );
    }
  } catch (error) {
    return next(CustomError.internal("Error while linking device"));
  }
};
