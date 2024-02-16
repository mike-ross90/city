const mongoose = require("mongoose");

// Define the Message schema
const messageSchema = new mongoose.Schema(
  {
    rideID: {
      type: String,
      required: true,
    },

    message: [{ type: Object }],

    // Other message-related fields
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = { Message };
