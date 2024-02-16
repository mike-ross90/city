import chaperoneModel from "../DB/Model/chaperoneModel.js"
import userModel from "../DB/Model/userModel.js"
import {addUserGeospatialData , getUserGeospatialData ,addDriverGeospatialData ,getDriverGeospatialData} from "../redis-cluster/cluster.js"


const locationSocketsRedis = (io) => {


  io.on('connection', (socket) => {

    socket.on("updateDriverLocation", async (data) => {
      

       const { long, lat, id } = data; 
    
       addDriverGeospatialData(long,lat,id)





      // Emit the updated location event to the specific client
      io.to(socket.id).emit("updateDriverLocation", "Driver Location Updated");
    });

    socket.on("updateUserLocation", async (data) => {
      console.log("updateUserLocation EMITTED ===============<")
      const { long, lat, id } = data;
      console.log("LONG", long)
      console.log("LAT",lat)
       //addUserGeospatialData(long,lat,id )
     const driver = await getDriverGeospatialData(long,lat ,5)
console.log("Near by driver [RAW]",driver)

const nearByDriver = driver.map((e) => {
  let parsedDrivers = JSON.parse(e);
  return { "driver": parsedDrivers };
});

console.log("NEARMAPPEDDERIVERS",nearByDriver)



      io.to(socket.id).emit("nearByDriver", {'data':nearByDriver});
    });


  });
}





export default locationSocketsRedis;


