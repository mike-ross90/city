import userModel from "../DB/Model/userModel.js";
import RideModel from "../DB/Model/rideModel.js";
import chaperoneModel from "../DB/Model/chaperoneModel.js";
// import driverModel from "../DB/Model/driverModel.js";
import NamespaceManager from "../controller/nameSpaceManager.js";
import profileModel from "../DB/Model/profileModel.js";
import driverModel from "../DB/Model/driverModel.js";

const userSockets = (io) => {
  const namespaceManager = new NamespaceManager(io);

  io.on("connection", async (socket) => {
    console.log("USER SOCKET CONNECTED");

    socket.on("checkUserConnectivity", (data) => {
      const { userID } = data;

      const userNamespace = namespaceManager.getUserNamespace(userID);
      if (userNamespace) {
        const extractedValue = userNamespace.name.split("/").pop();
        if (extractedValue == userID) {
          console.log(`User ${userID} is connected to their namespace`);
          socket.emit("connectivityStatus", { status: "connected" });
        } else {
          console.log(`User ${userID} is NOT connected to their namespace`);
          socket.emit("connectivityStatus", { status: "notConnected" });
        }
      } else {
        console.log(`User ${userID} namespace does not exist`);
        socket.emit("connectivityStatus", { status: "notConnected" });
      }
    });

    socket.on("connectUser", (data) => {
      const { userID } = data;
      console.log("connectUser socket hit!", data);

      const userNamespace = namespaceManager.createUserNamespace(userID);
      userNamespace.on("connection", (userSocket) => {
        console.log(`User ${userID} connected to their namespace`);

        // Add event listeners specific to this user's namespace
        // userSocket.on('customEvent', (data) => {
        //   console.log(`Received custom event from User ${userID}:`, data);
        // });

        //Already Accepted Ride

        // userSocket.on("checkAcceptedRide", async (data) => {
        //   console.log(`Received custom event from User ${userID}:`, data);

        //   const AcceptRide = await RideModel.findOne({
        //     creator: userID,
        //     havePaid: { $ne: true },
        //   }).sort({ createdAt: -1 });

        //   if (!AcceptRide) {
        //     return "No Rides Found";
        //   }

        //   const userData = await profileModel
        //     .findOne({ userId: AcceptRide.creator.toString() })
        //     .populate({
        //       path: "userId",
        //       populate: {
        //         path: "image",
        //       },
        //     });

        //   const driver = await driverModel
        //     .findOne({ userId: AcceptRide.acceptedBy.toString() })
        //     .populate({
        //       path: "userId",
        //       populate: {
        //         path: "image",
        //       },
        //     });

        //   const profile = await profileModel.findOne({
        //     userId: AcceptRide.acceptedBy.toString(),
        //   });

        //   const rideDatas = {
        //     driver,
        //     profile,
        //   };

        //   if (AcceptRide.status == "completed") {
        //     const rideData = {
        //       rideDetails: {
        //         driverDetails: rideDatas,
        //         userDetails: userData,
        //         rideId: AcceptRide._id,
        //         destination: AcceptRide.destination,
        //         from: AcceptRide.from,
        //         estFare: AcceptRide.estFare,
        //         distance: AcceptRide.distance,
        //       },

        //       status: "completed",

        //       ridestate: {
        //         driverId: AcceptRide.acceptedBy,
        //         distance: AcceptRide.distance,
        //         estFare: AcceptRide.estFare,
        //         arrivalTime: AcceptRide.arrivalTime,
        //         waitingTime: AcceptRide.waitingTime,
        //       },
        //     };

        //     return userNamespace.emit("checkAcceptedRide", rideData);
        //   } else if (AcceptRide.status == "started") {
        //     return userNamespace.emit("checkAcceptedRide", {
        //       status: "started",
        //       details: {
        //         data: RideData,
        //         rideCreator: userData,
        //         rideID: AcceptRide._id,
        //         destination: AcceptRide.destination,
        //         from: AcceptRide.from,
        //         estFare: AcceptRide.estFare,
        //         distance: AcceptRide.distance,
        //         type: AcceptRide.type,
        //         mode: AcceptRide.mode,
        //       },
        //       ridestate: {
        //         status: 1,
        //         msg: "Ride has been started",
        //         rideID: AcceptRide._id,
        //       },
        //     });
        //   } else if (AcceptRide.status == "arrived") {
        //     return userNamespace.emit("checkAcceptedRide", {
        //       status: "arrived",
        //       details: {
        //         data: RideData,
        //         rideCreator: userData,
        //         rideID: AcceptRide._id,
        //         destination: AcceptRide.destination,
        //         from: AcceptRide.from,
        //         estFare: AcceptRide.estFare,
        //         distance: AcceptRide.distance,
        //         type: AcceptRide.type,
        //         mode: AcceptRide.mode,
        //       },
        //       ridestate: "Driver has arrived",
        //     });
        //   } else if (AcceptRide.status == "accepted") {
        //     // const userData = await userModel
        //     //   .findOne({ user: userID })
        //     //   .populate({
        //     //     path: "user",
        //     //     populate: {
        //     //       path: "image",
        //     //     },
        //     //   });

        //     const userData = await profileModel
        //       .findOne({ userId: userID })
        //       .populate({
        //         path: "userId",
        //         populate: {
        //           path: "image",
        //         },
        //       });

        //     const rideDetails = {
        //       details: {
        //         data: RideData,
        //         rideCreator: userData,
        //         rideID: AcceptRide._id,
        //         destination: AcceptRide.destination,
        //         from: AcceptRide.from,
        //         estFare: AcceptRide.estFare,
        //         distance: AcceptRide.distance,
        //         type: AcceptRide.type,
        //         mode: AcceptRide.mode,
        //       },
        //       status: "accepted",
        //       ridestate: 1,
        //     };

        //     return userNamespace.emit("checkAcceptedRide", rideDetails);
        //   }

        //   // driverNamespace.emit("checkAcceptedRide", rideDetails);
        // });

        // userSocket.on("checkPreRide", async (data) => {
        //   console.log("checkAcceptedRide event from User");
        //   console.log(`Received custom event from User ${userID}:`, data);

        //   const AcceptRide = await RideModel.findOne({
        //     creator: userID,
        //     status: "accepted",
        //     mode: "pre",
        //   }).sort({ createdAt: -1 });

        //   if (!AcceptRide) {
        //     return "No Rides Found";
        //   }

        //   const RideData = await chaperoneModel
        //     .findOne({ user: AcceptRide.acceptedBy.toString() })
        //     .populate({
        //       path: "user",
        //       populate: {
        //         path: "image",
        //       },
        //     });

        //   const userData = await userModel.findOne({ user: userID }).populate({
        //     path: "user",
        //     populate: {
        //       path: "image",
        //     },
        //   });

        //   const rideDetails = {
        //     data: RideData,
        //     rideCreator: userData,
        //     rideID: AcceptRide._id,
        //     destination: AcceptRide.destination,
        //     from: AcceptRide.from,
        //     estFare: AcceptRide.estFare,
        //     distance: AcceptRide.distance,
        //     type: AcceptRide.type,
        //     mode: AcceptRide.mode,
        //   };

        //   const driverNamespace = io.of(
        //     `/driverNamespace/${AcceptRide.acceptedBy.toString()}`
        //   );

        //   const userNamespace = io.of(`/userNamespace/${userID}`);

        //   userNamespace.emit("checkAcceptedRide", rideDetails);
        //   // driverNamespace.emit("checkAcceptedRide", rideDetails);
        // });

        // userSocket.on("onAcceptRide", async (data) => {
        //   try {
        //     const { driverID, rideID } = data;
        //     console.log("onAcceptride Data", data);

        //     const checkRideStatus = await RideModel.findById(rideID);
        //     if (checkRideStatus) {
        //       if (checkRideStatus.status === "accepted") {
        //         console.log("ride alreadty accepted");
        //         return "Ride Already accepted";
        //       }
        //     }

        //     const AcceptRide = await RideModel.findByIdAndUpdate(
        //       rideID,
        //       { acceptedBy: driverID, status: "accepted" },
        //       { new: true }
        //     );

        //     if (!AcceptRide) {
        //       return "Invalid Ride id";
        //     }

        //     const driverNamespace = io.of(
        //       `/driverNamespace/${AcceptRide.acceptedBy.toString()}`
        //     );

        //     const userNamespace = io.of(`/userNamespace/${userID}`);

        //     const RideData = await driverModel
        //       .findOne({ userId: AcceptRide.acceptedBy.toString() })
        //       .populate({
        //         path: "userId",
        //         populate: {
        //           path: "image",
        //         },
        //       });

        //     // const userNamespace = io.of(`/userNamespace/${AcceptRide.creator.toString()}`);

        //     // Emit the updated location event to the specific client
        //     // const EmitRide = userNamespace.emit("onAcceptRide", {
        //     //   data: RideData,
        //     //   rideID,
        //     //   destination: AcceptRide.destination,
        //     //   from: AcceptRide.from
        //     // });

        //     // driverNamespace.emit("onAcceptRide", {
        //     //   data: RideData,
        //     //   rideID,
        //     //   destination: AcceptRide.destination,
        //     //   from: AcceptRide.from
        //     // });

        //     const rideDetails = {
        //       data: RideData,
        //       rideCreator: userData,
        //       rideID,
        //       destination: AcceptRide.destination,
        //       from: AcceptRide.from,
        //       estFare: AcceptRide.estFare,
        //       distance: AcceptRide.distance,
        //       type: AcceptRide.type,
        //       mode: AcceptRide.mode,
        //     };

        //     userNamespace.emit("onAcceptRide", rideDetails);
        //     driverNamespace.emit("onAcceptRide", rideDetails);

        //     // Handle potential errors during event emission
        //   } catch (error) {
        //     // Handle any errors here, such as database errors or validation issues
        //     console.error("Error in acceptRide:", error);
        //     return "An error occurred while processing the request";
        //   }
        // });

        // userSocket.on("checkPayment", async (data) => {
        //   //const {rideID} = data
        //   const checkRideStatus = await RideModel.findOne({
        //     creator: userID,
        //     havePaid: false,
        //   });
        //   if (checkRideStatus) {
        //     userNamespace.emit("checkPayment", {
        //       status: false,
        //       message: "Payment Uncompleted",
        //       data: checkRideStatus,
        //     });
        //   }
        // });

        userSocket.on("disconnect", () => {
          namespaceManager.destroyUserNamespace(userID);
          console.log(`User ${userID} disconnected from their namespace`);
        });
      });
    });

    // const fetchRides = await RideModel.findOne({ status: "pending" }).populate({
    //   path: "creator",
    //   populate: {
    //     path: "image",
    //   },
    // });

    // socket.broadcast.emit("fetchRides", JSON.stringify(fetchRides));

    socket.on("RideCancel", async (data) => {
      console.log("RIDE CANCEL HITTED");
      const { rideID } = data;
      console.log("RideIDtoDELETE", rideID);

      const CancelRide = await RideModel.findByIdAndDelete(
        rideID,
        { new: true } // Set to true to return the updated document
      );
      console.log("ACCEPT", CancelRide);

      // Emit the updated location event to the specific client
      io.emit(`RideCancel`, { rideID });
    });
  });
};
export default userSockets;
