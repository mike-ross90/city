const { Chaperone } = require("../DB/Model/chaperoneModel.js");
const { Users } = require("../DB/Model/userModel");

const locationSockets = (io) => {
  io.on("connection", (socket) => {
    socket.on("updateDriverLocation", async (data) => {
      const { long, lat, id } = data;
      console.log(typeof long);
      console.log(typeof lat);

      console.log(data);
      console.log(data.lat);

      // Define the update query
      const updateData = {
        location: {
          type: "Point",
          coordinates: [long, lat], // Replace with the new coordinates
        },
      };

      // Update the document by its _id
      const updateLocation = await Chaperone.findByIdAndUpdate(
        id,
        updateData,
        { new: true } // Set to true to return the updated document
      );

      console.log(updateLocation);

      // Emit the updated location event to the specific client
      io.to(socket.id).emit("updateDriverLocation", "Driver Location Updated");
    });

    socket.on("updateUserLocation", async (data) => {
      const { long, lat, id } = data;
      console.log(typeof long);
      console.log(typeof lat);

      console.log(data);
      console.log(data.lat);

      // Define the update query
      const updateData = {
        location: {
          type: "Point",
          coordinates: [long, lat], // Replace with the new coordinates
        },
      };

      // Update the document by its _id
      const updateLocation = await Users.findByIdAndUpdate(
        id,
        updateData,
        { new: true } // Set to true to return the updated document
      );

      console.log("updateLocation", updateLocation);

      const nearByDriver = await Chaperone.find({
        location: {
          $near: {
            $geometry: {
              type: "point",
              coordinates: [long, lat],
              $maxDistance: 5000,
              minDistance: 500,
            },
          },
        },
      })
        .populate("user", "fullName")
        .select("location vehicleName");
      const mappedData = nearByDriver.map((e) => {
        return {
          location: e.location.coordinates,
          _id: e._id,
          vehicleName: e.vehicleName,
          fullName: e.user.fullName,
        };
      });
      console.log("mappedData===>", JSON.stringify(mappedData));
      // const pipeline = [
      //   {
      //     $geoNear: {
      //       key:"location",
      //       near: {

      //         type: 'Point',
      //         coordinates: [long, lat]
      //       },
      //       distanceField: 'distance',
      //       maxDistance: 5000,
      //       minDistance: 500,
      //       spherical: true
      //     }
      //   },
      //   {
      //     $lookup: {
      //       from: 'auths', // Replace with the actual name of your Auth collection
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: 'user'
      //     }
      //   }
      // ];

      // const nearByDriver = await Chaperone.aggregate(pipeline);

      // console.log("nearByDriver=========>",nearByDriver)
      // Emit the updated location event to the specific client
      io.to(socket.id).emit(
        "nearByDriver",
        JSON.stringify({ data: mappedData })
      );
    });
  });
};

module.exports = { locationSockets };
