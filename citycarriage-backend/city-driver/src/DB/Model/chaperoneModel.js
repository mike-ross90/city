import mongoose from "mongoose";
 

const Chaperone = mongoose.Schema(
  {
    isApproved: {
      type: Boolean,
      required: false,
      default: true,
    },
    isOnline: {
      type: Boolean,
      required: false,
      default: false,
    },
    status:{
      enum:["inRide" , "idle"],
      type: String,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      required: false,
      default: false,
    },
    vehicleName: {
      type: String,
      required: false,
    },
    vehicleNo: {
      type: String,
      required: false,
    },
    experience: {
      type: String,
      required: false,
    },
    licenceNumber: {
      type: String,
      required: false,
    },
    licenceExpiry: {
      type: String,
      required: false,
    },
    hourlyFare: {
      type: String,
      default: "0",
      required: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'auth',
    },
    idCard: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
    },
    drivingLicense: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "fileUpload",
    },
    rating: {
      type: Number,
      required: false,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
        default:"Point"
      },
      coordinates: {
        type: [Number], // Change to Number data type
        required: false,
       
      },
    },
   rejectedRides:[{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "ride",
   }],
   acceptedRides:[{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "ride",
   }]

  },
  {
    timestamps: true,
  }
);

Chaperone.index({ location: "2dsphere" });
const chaperoneModel = mongoose.model("chaperone", Chaperone);
export default chaperoneModel;
