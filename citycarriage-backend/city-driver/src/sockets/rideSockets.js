import chaperoneModel from "../DB/Model/chaperoneModel.js";
import profileModel from "../DB/Model/profileModel.js";
import driverModel from "../DB/Model/driverModel.js";
import RideModel from "../DB/Model/rideModel.js";
import {
  getDriverRealTimeLocation,
  setDriverRealTimeLocation,
} from "../redis-cluster/cluster.js";

const rideSockets = (io) => {
  io.on("connection", (socket) => {
    socket.on("arrived", async (data) => {
      try {
        const { rideId } = data;
        console.log(rideId, "rideId from frontend");

        const acceptRide = await RideModel.findByIdAndUpdate(
          rideId,
          { status: "arrived" },
          { new: true }
        );

        const driver = await driverModel
          .findOne({ userId: acceptRide.acceptedBy.toString() })
          .populate({
            path: "userId",
            populate: {
              path: "image",
            },
          });

        const profile = await profileModel.findOne({
          userId: acceptRide.acceptedBy.toString(),
        });

        const rideData = {
          driver,
          profile,
        };

        const userData = await profileModel
          .findOne({
            userId: acceptRide.creator.toString(),
          })
          .populate({
            path: "userId",
            populate: {
              path: "image",
            },
          });

        const userNamespace = io.of(
          `/userNamespace/${acceptRide.creator.toString()}`
        );
        userNamespace.emit("checkAcceptedRide", {
          status: "arrived",
          rideDetails: {
            status: true,
            driverDetails: rideData,
            userDetails: userData,
            rideId: acceptRide._id,
            destination: acceptRide.destination,
            from: acceptRide.from,
            estFare: acceptRide.estFare,
            distance: acceptRide.distance,
          },
          ridestate: "Driver has arrived",
        });

        io.emit(`arrived_${rideId}`, "Driver has arrived");
      } catch (error) {
        console.log("Error when the driver arrived: ", error.message);
      }
    });

    socket.on("startRide", async (data) => {
      try {
        console.log("CHECKING START RIDE");
        const { rideId } = data;
        console.log(rideId, "from frontend");

        await RideModel.findByIdAndUpdate(
          rideId,
          { status: "started" },
          { new: true }
        );

        io.emit(`startRide_${rideId}`, {
          status: 1,
          msg: "Ride has been started",
          rideId,
        });
      } catch (error) {
        console.log("Error starting ride: ", error);
      }
    });

    socket.on("rideInit", async (data) => {
      const { long, lat, id } = data;
      setDriverRealTimeLocation(long, lat, id);

      try {
        if (getDriverRealTimeLocation) {
          const realTimeLocation = await getDriverRealTimeLocation(id);
          io.emit(`rideInit_${id}`, realTimeLocation);
        }
      } catch (error) {
        console.log("Error initializing the ride: ", error);
      }
    });

    socket.on("inRideReject", async (data) => {
      try {
        const { rideId, rejectedBy } = data;
        console.log(data, "data from frontend for inRideReject");

        const ride = await RideModel.findById(rideId);
        console.log(ride, "checking ride obj");
        console.log(ride.acceptedBy, "checking acceptedBy");
        console.log(ride.creator, "checking creator");

        if (rejectedBy == "driver") {
          await RideModel.findByIdAndUpdate(
            rideId,
            {
              $push: { rejectedBy: ride.acceptedBy },
              $set: { status: "cancelled" },
            },
            { new: true }
          );
          io.emit(`rejectRide_${rideId}`, "Ride has been cancelled by driver");
        }

        if (rejectedBy == "user") {
          await RideModel.findByIdAndUpdate(
            rideId,
            {
              $push: { rejectedBy: ride.creator },
              $set: { status: "cancelled" },
            },
            { new: true }
          );
        }
        io.emit(`rejectRide_${rideId}`, "Ride has been cancelled by user");
      } catch (error) {
        console.log("Error rejecting ride: ", error.message);
      }
    });

    socket.on("endRide", async (data) => {
      try {
        const { rideId, lat, long, arrivalTime, waitingTime } = data;
        console.log(data, "data from frontend");

        const ride = await RideModel.findById(rideId);
        if (!ride) {
          return io.emit(`endRide_${rideId}`, "Ride not found");
        }
        await driverModel.findOneAndUpdate(
          {
            userId: ride.acceptedBy,
          },
          {
            location: {
              type: "Point",
              coordinates: [long, lat],
            },
            status: "idle",
          },
          { new: true }
        );

        const currentTime = new Date();
        const endRide = await RideModel.findByIdAndUpdate(
          rideId,
          {
            rideEndTime: currentTime,
            arrivalTime,
            waitingTime,
            status: "completed",
          },
          { new: true }
        );

        const rideData = {
          driverId: endRide.acceptedBy,
          distance: endRide.distance,
          estFare: endRide.estFare,
          arrivalTime: arrivalTime,
          waitingTime: waitingTime,
        };
        io.emit(`endRide_${rideId}`, rideData);
      } catch (error) {
        console.error("Error ending this ride", error.message);
      }
    });

    socket.on("ridePayment", async (data) => {
      try {
        const { rideId, payment } = data;
        console.log(data, "data from frontend");

        await RideModel.findByIdAndUpdate(rideId, { havePaid: true });

        io.emit(`ridePayment_${rideId}`, {
          payment,
          message: "Payment received successfully",
          sucess: true,
        });
      } catch (error) {
        console.log("Error while ride payment: ", error.message);
      }
    });
  });
};

export default rideSockets;
