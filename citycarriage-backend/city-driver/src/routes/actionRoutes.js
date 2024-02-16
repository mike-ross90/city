
const { Router,application } =require('express');

let actionRouters = Router();



// Define the route for creating a new contact form entry


actionRouters.route("/createprofile").post(actionController.createProfile);


  
module.exports = {actionRouters}




