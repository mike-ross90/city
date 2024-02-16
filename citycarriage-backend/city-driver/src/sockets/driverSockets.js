import CustomSuccess from "../../../city-main/src/Utils/ResponseHandler/CustomSuccess.js";
import CustomError from "../../../city-main/src/Utils/ResponseHandler/CustomError.js";
import {
  deleteDriverGeospatialData,
  getDistanceTime,
  setDistanceTime,
} from "../redis-cluster/cluster.js";
import NamespaceManager from "../controller/nameSpaceManager.js";
import fileUploadModel from "../DB/Model/fileUploadModel.js";
import chaperoneModel from "../DB/Model/chaperoneModel.js";
import profileModel from "../DB/Model/profileModel.js";
import driverModel from "../DB/Model/driverModel.js";
import authModel from "../DB/Model/authModel.js";
import RideModel from "../DB/Model/rideModel.js";
import userModel from "../DB/Model/userModel.js";

const driverSockets = (io) => {
  const namespaceManager = new NamespaceManager(io);

  io.on("connection", async (socket) => {
    console.log("DRIVER SOCKET CONNECTED");

    socket.on("broadcastRideRequests", async (data) => {
      console.log("broadcastRideRequests socket hit! ====>>>> ");
      try {
        const fetchRides = await RideModel.find({ status: "pending" })
          .populate({
            path: "creator",
            populate: {
              path: "image",
            },
          })
          .sort({ createdAt: -1 });

        for (const ride of fetchRides) {
          try {
            console.log(ride._id, "all rides here ");
            const creatorId = ride.creator._id;
            const profile = await profileModel
              .findOne({
                userId: creatorId.toString(),
              })
              .select("firstName lastName -_id");

            const rideData = {
              ride,
              profile,
            };

            console.log("all rides here ----->> ", rideData);
            io.emit("fetchRides", rideData);
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
          }
        }
      } catch (error) {
        console.error("Error fetching and broadcasting ride requests:", error);
      }
    });

    socket.on("checkDriverConnectivity", (data) => {
      const { driverID } = data;

      const driverNamespace = namespaceManager.getDriverNamespace(driverID);
      if (driverNamespace) {
        const extractedValue = driverNamespace.name.split("/").pop();
        if (extractedValue == driverID) {
          console.log(`Driver ${driverID} is connected to their namespace`);
          socket.emit("connectivityStatus", { status: "connected" });
        } else {
          console.log(`Driver ${driverID} is NOT connected to their namespace`);
          socket.emit("connectivityStatus", { status: "notConnected" });
        }
      } else {
        console.log(`Driver ${driverID} namespace does not exist`);
        socket.emit("connectivityStatus", { status: "notConnected" });
      }
    });

    socket.on("connectDriver", (data) => {
      const { driverID } = data;
      console.log("connectDriver socket hit!", data);

      const driverNamespace = namespaceManager.createDriverNamespace(driverID);
      driverNamespace.on("connection", (driverSocket) => {
        console.log(`Driver ${driverID} connected to their namespace`);

        driverSocket.on("rideStatus", async (data) => {
          try {
            console.log("rideStatus HIT socket");
            const { userId } = data;
            console.log("userId from frontend >>>>>>> ", userId);

            const checkStatus = await RideModel.findOne({ creator: userId });
            if (checkStatus.status === "started") {
              const userNamespace = io.of(`/userNamespace/${userId}`);
              userNamespace.emit("rideStatus", checkStatus);
            }
          } catch (error) {
            console.error("Error handling rideStatus:", error);
          }
        });

        driverSocket.on("onAcceptRide", async (data) => {
          try {
            console.log("onAcceptride data hit!");
            const { driverId, rideID, lat, long } = data;
            console.log("onAcceptride data => ", data);

            const checkRideStatus = await RideModel.findById(rideID);
            if (!checkRideStatus) {
              const driverNamespace = io.of(`/driverNamespace/${driverID}`);
              return driverNamespace.emit("onAcceptRide", {
                status: false,
                message: "Ride has been cancelled",
              });
            }

            if (checkRideStatus) {
              if (checkRideStatus.status !== "pending") {
                const driverNamespace = io.of(`/driverNamespace/${driverID}`);
                return driverNamespace.emit("onAcceptRide", {
                  status: false,
                  message: "Ride already accepted",
                });
              }
            }

            const AcceptRide = await RideModel.findByIdAndUpdate(
              rideID,
              { acceptedBy: driverId, status: "accepted" },
              { new: true }
            );

            await driverModel.findOneAndUpdate(
              { userId: driverId },
              {
                location: {
                  type: "Point",
                  coordinates: [long, lat],
                },
                status: "inRide",
              },
              { new: true }
            );

            if (!AcceptRide) {
              return "Invalid Ride id";
            }

            const driverNamespace = io.of(`/driverNamespace/${driverID}`);
            const userNamespace = io.of(
              `/userNamespace/${AcceptRide.creator.toString()}`
            );

            const driver = await driverModel
              .findOne({ userId: AcceptRide.acceptedBy.toString() })
              .populate({
                path: "userId",
                populate: {
                  path: "image",
                },
              });

            const profile = await profileModel.findOne({
              userId: AcceptRide.acceptedBy.toString(),
            });

            const rideDatas = {
              driver,
              profile,
            };

            const userData = await profileModel
              .findOne({ userId: AcceptRide.creator.toString() })
              .populate({
                path: "userId",
                populate: {
                  path: "image",
                },
              });

            const rideData = {
              rideDetails: {
                status: true,
                driverDetails: rideDatas,
                userDetails: userData,
                rideId: rideID,
                destination: AcceptRide.destination,
                from: AcceptRide.from,
                estFare: AcceptRide.estFare,
                distance: AcceptRide.distance,
              },
            };

            console.log(rideData, "rideData here <<<<<<<<<<<<<<<<<<<<<<<<<<");

            userNamespace.emit("onAcceptRide", rideData);
            driverNamespace.emit("onAcceptRide", rideData);
          } catch (error) {
            console.error("Error in onAcceptRide:", error);
            return "An error occurred while processing the request";
          }
        });

        // Add event listeners specific to this user's namespace

        driverSocket.on("checkAcceptedRide", async (data) => {
          console.log("checkAcceptedRide socket hit!");

          const AcceptRide = await RideModel.findOne({
            acceptedBy: driverID,
            havePaid: { $ne: true },
          }).sort({ createdAt: -1 });

          if (!AcceptRide) {
            return "No Rides found";
          }

          const userData = await userModel
            .findOne({ user: AcceptRide.creator.toString() })
            .populate({
              path: "user",
              populate: {
                path: "image",
              },
            });

          const RideData = await chaperoneModel
            .findOne({ user: AcceptRide.acceptedBy.toString() })
            .populate({
              path: "user",
              populate: {
                path: "image",
              },
            });

          if (AcceptRide.status == "completed") {
            const rideData = {
              details: {
                data: RideData,
                rideCreator: userData,
                rideID: AcceptRide._id,
                destination: AcceptRide.destination,
                from: AcceptRide.from,
                estFare: AcceptRide.estFare,
                distance: AcceptRide.distance,
                type: AcceptRide.type,
                mode: AcceptRide.mode,
              },

              status: "completed",

              ridestate: {
                driverId: AcceptRide.acceptedBy,
                distance: AcceptRide.distance,
                estFare: AcceptRide.estFare,
                arrivalTime: AcceptRide.arrivalTime,
                waitingTime: AcceptRide.waitingTime,
              },
            };

            return driverNamespace.emit("checkAcceptedRide", rideData);
          } else if (AcceptRide.status == "started") {
            return driverNamespace.emit("checkAcceptedRide", {
              status: "started",
              details: {
                data: RideData,
                rideCreator: userData,
                rideID: AcceptRide._id,
                destination: AcceptRide.destination,
                from: AcceptRide.from,
                estFare: AcceptRide.estFare,
                distance: AcceptRide.distance,
                type: AcceptRide.type,
                mode: AcceptRide.mode,
              },
              ridestate: {
                status: 1,
                msg: "Ride has been started",
                rideID: AcceptRide._id,
              },
            });
          } else if (AcceptRide.status == "arrived") {
            return driverNamespace.emit("checkAcceptedRide", {
              status: "arrived",
              details: {
                data: RideData,
                rideCreator: userData,
                rideID: AcceptRide._id,
                destination: AcceptRide.destination,
                from: AcceptRide.from,
                estFare: AcceptRide.estFare,
                distance: AcceptRide.distance,
                type: AcceptRide.type,
                mode: AcceptRide.mode,
              },
              ridestate: "Driver has arrived",
            });
          } else if (AcceptRide.status == "accepted") {
            const userData = await userModel
              .findOne({ user: AcceptRide.creator.toString() })
              .populate({
                path: "user",
                populate: {
                  path: "image",
                },
              });

            const rideDetails = {
              details: {
                data: RideData,
                rideCreator: userData,
                rideID: AcceptRide._id,
                destination: AcceptRide.destination,
                from: AcceptRide.from,
                estFare: AcceptRide.estFare,
                distance: AcceptRide.distance,
                type: AcceptRide.type,
                mode: AcceptRide.mode,
              },
              status: "accepted",
              ridestate: 1,
            };

            return driverNamespace.emit("checkAcceptedRide", rideDetails);
          }

          // driverNamespace.emit("checkAcceptedRide", rideDetails);
        });

        // driverNamespace.on("broadcastRideRequests", async (data) => {
        //   try {
        //     const fetchRides = await RideModel.findOne({
        //       status: "pending",
        //       rejectedBy: { $nin: [driverID] },
        //     }).populate({
        //       path: "creator",
        //       populate: {
        //         path: "image",
        //       },
        //     });

        //     if (fetchRides) {
        //       //io.emit('fetchRides', fetchRides);
        //       io.emit("fetchRides", JSON.stringify(fetchRides));
        //     }
        //   } catch (error) {
        //     console.error(
        //       "Error fetching and broadcasting ride requests:",
        //       error
        //     );
        //     return next(CustomError.createError(error.message, 500));
        //   }
        // });

        driverSocket.on("disconnect", () => {
          deleteDriverGeospatialData(driverID);
          namespaceManager.destroyDriverNamespace(driverID);
          console.log(`Driver ${driverID} disconnected from their namespace`);
        });
      });
    });

    // const fetchRides = await RideModel.findOne({ status: "pending" }).populate({
    //   path: "creator",
    //   populate: {
    //     path: "image",
    //   },
    // });

    // if (fetchRides) {
    //   io.emit("fetchRides", JSON.stringify(fetchRides));
    // }
    // socket.emit("fetchRides", JSON.stringify(fetchRides));

    socket.on("trackDistance", async (data) => {
      const { time, distance, id } = data;
      console.log(data, "<<<<<< hecking data from frontend");
      setDistanceTime(time, distance, id);

      if (getDistanceTime) {
        console.log(`Real time cordinates of driver ${id} ========>`);
        const realTimeLocation = await getDistanceTime(id);

        console.log("DATA TO EMIT =====>", realTimeLocation);
        io.emit(`trackDistance_${id}`, realTimeLocation);
      }
    });

    socket.on("rejectRide", async (data) => {
      try {
        const { driverId, rideId } = data;

        console.log("driverId =====>>> ", driverId);
        console.log("rideId ========>> ", rideId);

        const rejectRide = await RideModel.findByIdAndUpdate(
          rideId,
          { $push: { rejectedBy: driverId } },
          { new: true }
        );

        io.to(socket.id).emit("acceptRide", rejectRide);
      } catch (error) {
        console.log("Error regecting ride: ", error);
      }
    });

    // socket.on("rejectAfterRide", async (data) => {
    //   const { ChaperoneID, rideID } = data;

    //   await chaperoneModel.findByIdAndUpdate(
    //     ChaperoneID,
    //     {
    //       // location: {
    //       //             type: 'Point',
    //       //             coordinates: [long, lat],
    //       //           },
    //       status: "idle",
    //     },
    //     { new: true }
    //   );

    //   const rejectAfterRide = await RideModel.findByIdAndUpdate(
    //     rideID,
    //     { $push: { rejectedBy: ChaperoneID }, $set: { status: "pending" } },

    //     { new: true } // Set to true to return the updated document
    //   );
    //   console.log(rejectAfterRide);

    //   // Emit the updated location event to the specific client
    //   io.to(socket.id).emit("rejectAfterRide", rejectAfterRide);
    // });
  });
};

// const driverSockets = (io) => {
//   const namespaceManager = new NamespaceManager(io);

//   io.on("connection", async (socket) => {
//     socket.on("broadcastRideRequests", async (data) => {
//       try {
//         const fetchRides = await RideModel.find({ status: "pending" })
//           .populate({
//             path: "creator",
//             populate: {
//               path: "image",
//             },
//           })
//           .sort({ createdAt: -1 });

//         if (fetchRides) {
//           fetchRides.forEach((rides) => {
//             io.emit("fetchRides", rides);
//           });
//         }
//       } catch (error) {
//         return next(CustomError.createError(error.message, 500));
//       }
//     });

//     socket.on("checkDriverConnectivity", (data) => {
//       const { driverID } = data;

//       // Get the existing driverNamespace if it exists
//       const driverNamespace = namespaceManager.getDriverNamespace(driverID);
//       console.log(driverNamespace);
//       if (driverNamespace) {
//         // Check if there are connected sockets in the namespace
//         const extractedValue = driverNamespace.name.split("/").pop();

//         if (extractedValue == driverID) {
//           console.log(`Driver ${driverID} is connected to their namespace`);
//           // Emit a success message or perform any other action
//           socket.emit("connectivityStatus", { status: "connected" });
//         } else {
//           console.log(`Driver ${driverID} is NOT connected to their namespace`);
//           // Emit a failure message or perform any other action
//           socket.emit("connectivityStatus", { status: "notConnected" });
//         }
//       } else {
//         console.log(`Driver ${driverID} namespace does not exist`);
//         // Emit a failure message or perform any other action
//         socket.emit("connectivityStatus", { status: "notConnected" });
//       }
//     });

//     socket.on("connectDriver", (data) => {
//       const { driverID } = data;

//       console.log("Connect Driver Hit", data);

//       const driverNamespace = namespaceManager.createDriverNamespace(driverID);
//       // const driverNamespace = io.of(`/driverNamespace/${driverID}`);

//       driverNamespace.on("connection", (driverSocket) => {
//         console.log(`Driver ${driverID} connected to their namespace`);

//         // Add event listeners specific to this user's namespace

//         driverSocket.on("checkAcceptedRide", async (data) => {
//           console.log("checkAcceptedRide event from driverID");

//           const AcceptRide = await RideModel.findOne({
//             acceptedBy: driverID,
//             havePaid: { $ne: true },
//           }).sort({ createdAt: -1 });

//           if (!AcceptRide) {
//             return "No Rides Found";
//           }
//           const userData = await userModel
//             .findOne({ user: AcceptRide.creator.toString() })
//             .populate({
//               path: "user",
//               populate: {
//                 path: "image",
//               },
//             });

//           const RideData = await chaperoneModel
//             .findOne({ user: AcceptRide.acceptedBy.toString() })
//             .populate({
//               path: "user",
//               populate: {
//                 path: "image",
//               },
//             });

//           if (AcceptRide.status == "completed") {
//             const rideData = {
//               details: {
//                 data: RideData,
//                 rideCreator: userData,
//                 rideID: AcceptRide._id,
//                 destination: AcceptRide.destination,
//                 from: AcceptRide.from,
//                 estFare: AcceptRide.estFare,
//                 distance: AcceptRide.distance,
//                 type: AcceptRide.type,
//                 mode: AcceptRide.mode,
//               },

//               status: "completed",

//               ridestate: {
//                 driverId: AcceptRide.acceptedBy,
//                 distance: AcceptRide.distance,
//                 estFare: AcceptRide.estFare,
//                 arrivalTime: AcceptRide.arrivalTime,
//                 waitingTime: AcceptRide.waitingTime,
//               },
//             };

//             return driverNamespace.emit("checkAcceptedRide", rideData);
//           } else if (AcceptRide.status == "started") {
//             return driverNamespace.emit("checkAcceptedRide", {
//               status: "started",
//               details: {
//                 data: RideData,
//                 rideCreator: userData,
//                 rideID: AcceptRide._id,
//                 destination: AcceptRide.destination,
//                 from: AcceptRide.from,
//                 estFare: AcceptRide.estFare,
//                 distance: AcceptRide.distance,
//                 type: AcceptRide.type,
//                 mode: AcceptRide.mode,
//               },
//               ridestate: {
//                 status: 1,
//                 msg: "Ride has been started",
//                 rideID: AcceptRide._id,
//               },
//             });
//           } else if (AcceptRide.status == "arrived") {
//             return driverNamespace.emit("checkAcceptedRide", {
//               status: "arrived",
//               details: {
//                 data: RideData,
//                 rideCreator: userData,
//                 rideID: AcceptRide._id,
//                 destination: AcceptRide.destination,
//                 from: AcceptRide.from,
//                 estFare: AcceptRide.estFare,
//                 distance: AcceptRide.distance,
//                 type: AcceptRide.type,
//                 mode: AcceptRide.mode,
//               },
//               ridestate: "Driver has arrived",
//             });
//           } else if (AcceptRide.status == "accepted") {
//             const userData = await userModel
//               .findOne({ user: AcceptRide.creator.toString() })
//               .populate({
//                 path: "user",
//                 populate: {
//                   path: "image",
//                 },
//               });

//             const rideDetails = {
//               details: {
//                 data: RideData,
//                 rideCreator: userData,
//                 rideID: AcceptRide._id,
//                 destination: AcceptRide.destination,
//                 from: AcceptRide.from,
//                 estFare: AcceptRide.estFare,
//                 distance: AcceptRide.distance,
//                 type: AcceptRide.type,
//                 mode: AcceptRide.mode,
//               },
//               status: "accepted",
//               ridestate: 1,
//             };

//             return driverNamespace.emit("checkAcceptedRide", rideDetails);
//           }

//           // driverNamespace.emit("checkAcceptedRide", rideDetails);
//         });

//         driverNamespace.on("broadcastRideRequests", async (data) => {
//           try {
//             const fetchRides = await RideModel.findOne({
//               status: "pending",
//               rejectedBy: { $nin: [driverID] },
//             }).populate({
//               path: "creator",
//               populate: {
//                 path: "image",
//               },
//             });

//             if (fetchRides) {
//               //io.emit('fetchRides', fetchRides);
//               io.emit("fetchRides", JSON.stringify(fetchRides));
//             }
//           } catch (error) {
//             console.error(
//               "Error fetching and broadcasting ride requests:",
//               error
//             );
//           }
//         });

//         //checkUpdates = c

//         driverSocket.on("checkPreRide", async (data) => {
//           console.log(`Received custom event from User ${driverID}:`, data);

//           const AcceptRide = await RideModel.findOne({
//             acceptedBy: driverID,
//             status: "accepted",
//             mode: "pre",
//           }).sort({ createdAt: -1 });

//           if (!AcceptRide) {
//             return "No Rides Found";
//           }

//           const RideData = await chaperoneModel
//             .findOne({ user: AcceptRide.acceptedBy.toString() })
//             .populate({
//               path: "user",
//               populate: {
//                 path: "image",
//               },
//             });
//           const userData = await userModel
//             .findOne({ user: AcceptRide.creator.toString() })
//             .populate({
//               path: "user",
//               populate: {
//                 path: "image",
//               },
//             });

//           const rideDetails = {
//             status: true,
//             data: RideData,
//             rideCreator: userData,
//             rideID: AcceptRide._id,
//             destination: AcceptRide.destination,
//             from: AcceptRide.from,
//             estFare: AcceptRide.estFare,
//             distance: AcceptRide.distance,
//             type: AcceptRide.type,
//             mode: AcceptRide.mode,
//           };

//           const driverNamespace = io.of(
//             `/driverNamespace/${AcceptRide.acceptedBy.toString()}`
//           );

//           // const userNamespace = io.of(`/userNamespace/${AcceptRide.creator.toString()}`);

//           //userNamespace.emit("checkAcceptedRide", rideDetails);
//           driverNamespace.emit("checkAcceptedRide", rideDetails);
//         });

//         driverSocket.on("onAcceptRide", async (data) => {
//           try {
//             const { ChaperoneID, rideID, lat, long } = data;
//             console.log("onAcceptride Data", data);

//             const findPreBook = await RideModel.find({
//               acceptedBy: driverID,
//               mode: "pre",
//               status: { $nin: ["completed", "rejected"] },
//             });

//             const checkRideStatus = await RideModel.findById(rideID);

//             if (!checkRideStatus) {
//               const driverNamespace = io.of(`/driverNamespace/${driverID}`);
//               console.log("ride cancelled");
//               return driverNamespace.emit("onAcceptRide", {
//                 status: false,
//                 message: "Ride has been Cancelled",
//               });
//             }

//             if (checkRideStatus) {
//               if (checkRideStatus.status === "accepted") {
//                 const driverNamespace = io.of(`/driverNamespace/${driverID}`);
//                 console.log("ride alreadty accepted");
//                 return driverNamespace.emit("onAcceptRide", {
//                   status: false,
//                   message: "Ride Already Accepted",
//                 });
//               }

//               if (checkRideStatus.mode === "pre" && findPreBook.length != 0) {
//                 return driverNamespace.emit("onAcceptRide", {
//                   status: false,
//                   message: "Pre book already accepted",
//                 });
//               }
//             }

//             const AcceptRide = await RideModel.findByIdAndUpdate(
//               rideID,
//               { acceptedBy: ChaperoneID, status: "accepted" },
//               { new: true }
//             );

//             //findOneAndUpdate({_id: "12"}, {$set: {protocol: "http"}}

//             const updateChaperone = await chaperoneModel.findOneAndUpdate(
//               { user: ChaperoneID },
//               {
//                 location: {
//                   type: "Point",
//                   coordinates: [long, lat],
//                 },
//                 status: "inRide",
//               },
//               { new: true }
//             );

//             // console.log("RideDataaaaaaaaa",RideData)

//             if (!AcceptRide) {
//               return "Invalid Ride id";
//             }

//             const driverNamespace = io.of(`/driverNamespace/${driverID}`);

//             const userNamespace = io.of(
//               `/userNamespace/${AcceptRide.creator.toString()}`
//             );

//             const RideData = await chaperoneModel
//               .findOne({ user: AcceptRide.acceptedBy.toString() })
//               .populate({
//                 path: "user",
//                 populate: {
//                   path: "image",
//                 },
//               });

//             const userData = await userModel
//               .findOne({ user: AcceptRide.creator.toString() })
//               .populate({
//                 path: "user",
//                 populate: {
//                   path: "image",
//                 },
//               });

//             const rideDetails = {
//               status: true,
//               data: RideData,
//               rideCreator: userData,
//               rideID,
//               destination: AcceptRide.destination,
//               from: AcceptRide.from,
//               estFare: AcceptRide.estFare,
//               distance: AcceptRide.distance,
//               type: AcceptRide.type,
//               mode: AcceptRide.mode,
//             };

//             userNamespace.emit("onAcceptRide", rideDetails);
//             driverNamespace.emit("onAcceptRide", rideDetails);

//             // Handle potential errors during event emission
//           } catch (error) {
//             // Handle any errors here, such as database errors or validation issues
//             console.error("Error in acceptRide:", error);
//             return "An error occurred while processing the request";
//           }
//         });

//         driverSocket.on("disconnect", () => {
//           deleteDriverGeospatialData(driverID);
//           namespaceManager.destroyDriverNamespace(driverID);
//           console.log(`Driver ${driverID} disconnected from their namespace`);
//         });
//       });
//     });

//     //EVENT HIJACK TO CHECK IF SOCKET IS EMIITED OR NOT
//     //START OF CODE
//     // var onevent = socket.onevent;
//     // var eventNames = Object.keys(socket._events);
//     // socket.onevent = function (packet) {
//     //     onevent.call(this, packet);// original call

//     //     var eventName = packet.data[0];

//     //     if(eventNames.indexOf(eventName) == -1){
//     //         console.error('No handler for emitted event: '+eventName);
//     //     }
//     // };

//     //END OF CODE

//     const fetchRides = await RideModel.findOne({ status: "pending" }).populate({
//       path: "creator",
//       populate: {
//         path: "image",
//       },
//     });

//     if (fetchRides) {
//       io.emit("fetchRides", JSON.stringify(fetchRides));
//     }

//     // socket.emit("fetchRides",  JSON.stringify(fetchRides));

//     // socket.on("acceptRide", async (data) => {

//     //   const {ChaperoneID  , RideID} = data

//     //           const AcceptRide = await RideModel.findByIdAndUpdate(
//     //               RideID,
//     //           {acceptedBy:ChaperoneID , status:'accepted'},
//     //           { new: true } // Set to true to return the updated document
//     //         );
//     //         if(!AcceptRide){
//     //              return "Invalid Ride id"
//     //         }

//     //             const RideData =  await chaperoneModel.findOne({ user: AcceptRide.acceptedBy.toString() })
//     //             .populate({
//     //               path: 'user',
//     //               populate: {
//     //                 path: 'image',
//     //               },
//     //             });

//     //             console.log("RideData",RideData)

//     //             // Emit the updated location event to the specific client
//     //              io.emit(`acceptRide_${AcceptRide.creator.toString()}`,{data:RideData,RideID,destination:AcceptRide.destination ,from:AcceptRide.from });
//     //           });

//     socket.on("trackDistance", async (data) => {
//       const { time, distance, id } = data;
//       setDistanceTime(time, distance, id);

//       if (getDistanceTime) {
//         console.log(`Real time cordinates of driver ${id} ========>`);
//         const realTimeLocation = await getDistanceTime(id);

//         console.log("DATA TO EMIT =====>", realTimeLocation);
//         io.emit(`trackDistance_${id}`, realTimeLocation);

//         // console.log("THE REAL GETTED CORDINATES" , realTimeLocation);
//       }
//     });

//     //const acceptRideNamespace = io.of(/^\/acceptedRide\/\d+$/);

//     //  socket.on(acceptRide_n)
//     //   socket.on(acceptRide_2131)

//     socket.on("rejectRide", async (data) => {
//       const { ChaperoneID, rideID } = data;

//       const rejectRide = await RideModel.findByIdAndUpdate(
//         rideID,
//         { $push: { rejectedBy: ChaperoneID } },

//         { new: true } // Set to true to return the updated document
//       );
//       console.log(rejectRide);

//       // Emit the updated location event to the specific client
//       io.to(socket.id).emit("acceptRide", rejectRide);
//     });

//     socket.on("rejectAfterRide", async (data) => {
//       const { ChaperoneID, rideID } = data;

//       await chaperoneModel.findByIdAndUpdate(
//         ChaperoneID,
//         {
//           // location: {
//           //             type: 'Point',
//           //             coordinates: [long, lat],
//           //           },
//           status: "idle",
//         },
//         { new: true }
//       );

//       const rejectAfterRide = await RideModel.findByIdAndUpdate(
//         rideID,
//         { $push: { rejectedBy: ChaperoneID }, $set: { status: "pending" } },

//         { new: true } // Set to true to return the updated document
//       );
//       console.log(rejectAfterRide);

//       // Emit the updated location event to the specific client
//       io.to(socket.id).emit("rejectAfterRide", rejectAfterRide);
//     });
//   });
// };
export default driverSockets;
