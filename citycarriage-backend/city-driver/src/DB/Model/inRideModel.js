import mongoose from "mongoose";


const InRideSchema = mongoose.Schema(
  {

 
      from: {
        address:{
          type: String,
          required: false,
         
        },
        lat:{
          type: Number,
          required: false,
         
        },
        long:{
          type: Number,
          required: false,
         
        }
      
      
      },
    destination: {
      address:{
        type: String,
        required: false,
       
      },
      lat:{
        type: Number,
        required: false,
       
      },
      long:{
        type: Number,
        required: false,
       
      }
    
    
    },

    estFare:{
        type: String,
        required: false,
    },
    distance:{
      type: String,
        required: false,
    },

      
      rideID:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Ride',
    },
    userID:{

        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'auth',

    },
    chaperoneID:{

        type: mongoose.Schema.Types.ObjectId,
        required: false,
        ref: 'auth',

    },

    status:{
        type: String,
        enum: ["arrived","in-progress" ,"completed" ,"rejected" ],
        default:"arrived",
        required: true,
    },

    rejectedBy:{

      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'auth',

  },


rideStartTime:{
    type: String,
},
rideEndTime:{
    type: String,
},
waitTime:{
  type: Number,
}


  },
  {
    timestamps: true,
  }
);

const InRideModel = mongoose.model("inride", InRideSchema);
export default InRideModel;
