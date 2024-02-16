const mongoose = require("mongoose")

const DeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "auth",
    },
    status: {
      type: String,
      enum: ["active", "disactive"],
      default: "active",
    },
    lastSeen: {
      type: Date,
      default: Date.now(),
    },
    deviceType: {
      type: String,
      enum: ["android", "postman", "mac"],
      default: null,
    },
    deviceMAC: {
      type: String,
      default: null,
    },
    deviceToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const DeviceModel = mongoose.model("device", DeviceSchema);

export default DeviceModel;
