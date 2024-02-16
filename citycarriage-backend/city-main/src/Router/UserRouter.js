
import { Router,application } from "express";
import {  AuthMiddleware } from "./Middleware/AuthMiddleware.js";
import UserController from "../Controller/UserController.js";

export let UserRouters = Router();


// Define the route for creating a new contact form entry



application.prefix = Router.prefix = function (path, middleware, configure) {
    configure(UserRouters);
    this.use(path, middleware, UserRouters);
    return UserRouters;
  };
  


  UserRouters.prefix("/user", AuthMiddleware, () => {
    //UserRouters.route("/contact").post(UserController.createContactForm)    
    // EventRouters.route("/event")
    // .post(UploadFilter.uploadEvents.single("file"), EventController.createEvent)

  });
  




