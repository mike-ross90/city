const mongoose = require("mongoose")

const faqSchema = mongoose.Schema({

item:[{type:Object}],
contentType:{
    type:String,
    enum:["faq"],
    default:null
},
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



const faqModel = mongoose.model("faq", faqSchema);

export default faqModel;