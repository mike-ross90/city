const mongoose = require('mongoose');



const fileUploadSchema = new mongoose.Schema(
  {
    file: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },   
    
    messageID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "message",
    },
  },
  {
    timestamps: true,
  },
);




const fileUploadModel = mongoose.model('fileUpload', fileUploadSchema);

module.exports =  {fileUploadModel} ;