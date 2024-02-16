import CustomError from "../../../city-main/src/Utils/ResponseHandler/CustomError.js";
import chaperoneModel from "../DB/Model/chaperoneModel.js";
import driverModel from "../DB/Model/driverModel.js";
import RideModel from "../DB/Model/rideModel.js";
import {
  deleteDriverGeospatialData,
  addDriverGeospatialData,
} from "../redis-cluster/cluster.js";

// need to replace chaperone with driver models

const actionSockets = (io) => {
  io.on("connection", (socket) => {
    console.log(socket.id + " connected");

    socket.emit("Athar bhai sai socket connect hogya");
    socket.emit("fromServer", "Athar bhai sai dobara socket connect hogya");

    socket.on("fromClient", (data) => {
      console.log(data);
      socket.emit(
        "fromServer",
        "Athar bhai sai socket.on karnay kai baad socket connect hogya"
      );
    });

    socket.on("driver_init", async (data) => {
      const driverStatus = await driverModel.findOne({ userId: data });
      if (!driverStatus) {
        return {
          status: 0,
          message: "Invalid Driver call",
        };
      }
      // const driverStatus = await chaperoneModel.findOne({ user: data });
      // if (!driverStatus) {
      //   return {
      //     status: 0,
      //     message: "Invalid Driver call",
      //   };
      // }
      // console.log(driverStatus)

      const status = driverStatus.isOnline ? "Online" : "Offline";

      console.log("Thie status is ==>", status);
      console.log(`driver_init_${data}`);
      socket.emit(`driver_init_${data}`, status);
    });

    socket.on("updateStatus", async (data) => {
      const { isOnline, id, lat, long } = data;

      console.log("driver coordinate ", data);

      const updateStatus = await driverModel.findOneAndUpdate(
        { userId: id },
        {
          $set: {
            location: { type: "Point", coordinates: [long, lat] },
            isOnline,
          },
        },
        {
          new: true,
        }
      );
      const status = updateStatus.isOnline ? "Online" : "Offline";

      if (status == "Online") {
        const fetchRides = await RideModel.find({
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [long, lat],
              },
              $maxDistance: 30,
              $minDistance: 10,
            },
          },
          status: "pending",
        }).populate({
          path: "creator",
          populate: {
            path: "image",
          },
        });
        addDriverGeospatialData(long, lat, id);
        // const fetchRides = await RideModel.findOne({ status: 'pending'} ).populate({
        //   path: 'creator',
        //   populate: {
        //     path: 'image',
        //   },
        // });

        socket.emit("fetchRides", JSON.stringify(fetchRides));
      } else if (status == "Offline") {
        deleteDriverGeospatialData(id);
      }
      socket.emit(`checkStatus_${id}`, { status });
      //  UpdateStatus.isOnline ? await chaperoneModel.findByIdAndUpdate(id, {location }) : ""

      io.to(socket.id).emit(`driver_init_${id}`, status);

      // socket.emit(`changeStatus_${socket.id}`, chaperoneModel.isOnline)
    });
  });
};
export default actionSockets;
