const mongoose = require("mongoose")
const conversationSchema = new mongoose.Schema({
    type: {
      type: String,
      enum: ['private', 'group'], // Add more types if needed
    },
    participants: [
      {
        type: String, // mongoose.Schema.Types.ObjectId,
        //ref: 'User',
      },
      // Other conversation-related fields
    ],
   title: {
      type: String,
    },
    
  },{timestamps: true});

  const Conversation = mongoose.model('Conversation', conversationSchema);
  module.exports = {Conversation};