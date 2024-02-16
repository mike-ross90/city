import mongoose from "mongoose";

const contentSchema = mongoose.Schema({
contentType:{
    type:String,
    enum:["privacy","terms","about"],
    default:null
},
title:{type:String},
file:[{    
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "fileUpload",
}],
user:{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "auth",
}
},{
    timestamps: true,
    
})



const ContentModel = mongoose.model("content", contentSchema);

export default ContentModel;