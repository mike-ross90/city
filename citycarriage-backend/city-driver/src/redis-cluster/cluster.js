import Redis from "ioredis";
import chaperoneModel from "../DB/Model/chaperoneModel.js";
// Create a Redis Cluster client
export const redis = new Redis.Cluster([
  {
    host: "127.0.0.1", // Replace with your Redis Cluster node addresses and ports
    port: 7000,
  },
  {
    host: "127.0.0.1",
    port: 7001,
  },
  {
    host: "127.0.0.1", // Replace with your Redis Cluster node addresses and ports
    port: 7002,
  },
  {
    host: "127.0.0.1",
    port: 7003,
  },
  {
    host: "127.0.0.1", // Replace with your Redis Cluster node addresses and ports
    port: 7004,
  },
  {
    host: "127.0.0.1",
    port: 7005,
  },
  // Add more nodes as needed
]);

// Add geospatial data
export async function addUserGeospatialData(long, lat, id) {
  try {
    // GEOADD command to add locations
    await redis.geoadd("userLocations", [long, lat, id]);
    console.log("Geospatial data added successfully.");
  } catch (error) {
    console.error("Error adding geospatial data:", error);
  }
}

// Get geospatial data
export async function getUserGeospatialData(long, lat, radius) {
  try {
    // GEORADIUS command to get locations within a radius
    const locations = await redis.georadius(
      "userLocations",
      long,
      lat,
      radius,
      "km"
    );
    console.log("Locations within the radius:", locations);
  } catch (error) {
    console.error("Error getting geospatial data:", error);
  }
}

export async function setDriverRealTimeLocation(long, lat, id) {
  const data = {
    id,
    long,
    lat,
  };
  const jsonString = JSON.stringify(data);
  const expirationInSeconds = 3600;
  if (!id == "") {
    await redis.set(
      `realtimedriver${id}`,
      jsonString,
      "EX",
      expirationInSeconds
    );
  }
}

export async function getDriverRealTimeLocation(id) {
  const result = await redis.get(`realtimedriver${id}`);
  // console.log("getDriverRealTimeLocation===> cluster===>",result)
  return result;
}

export async function deleteDriverGeospatialData(driverId) {
  try {
    // Delete the geospatial data from the cache
    await redis.zrem("driverLocations", driverId);
    await redis.del(`driver${driverId}`);
    console.log(`Cache cleared for driver with ID: ${driverId}`);
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}

export async function addDriverGeospatialData(long, lat, id) {
  try {
    console.log("addDriverGeospatialData HIT");
    const data = {
      id,
      long,
      lat,
    };
    const jsonString = JSON.stringify(data);

    if (!id == "") {
      await redis.geoadd("driverLocations", [long, lat, id]);
      await redis.set(`driver${id}`, jsonString);
    }
  } catch (error) {
    console.error("Error adding geospatial data:", error);
  }
}

// Get geospatial data
export async function getDriverGeospatialData(long, lat, radius) {
  try {
    // GEORADIUS command to get locations within a radius
    const driverID = await redis.georadius(
      "driverLocations",
      long,
      lat,
      radius,
      "km"
    );
    console.log("driverID", driverID);

    const nearbyDrivers = await Promise.all(
      driverID.map(async (driver) => {
        const result = await redis.get(`driver${driver}`);
        return result;
      })
    );

    return nearbyDrivers;
  } catch (error) {
    console.error("Error getting geospatial data:", error);
  }
}

export async function SaveUserData(id, user) {
  try {
    //Save UserData to cache

    const Users = await redis.hset("users", id, JSON.stringify(user));
    console.log("Users Dumped to cache:", Users);
    return Users;
  } catch (error) {
    console.error("Error getting geospatial data:", error);
  }
}

export async function SaveDriverData(id, user) {
  try {
    const Drivers = await redis.hset("drivers", id, JSON.stringify(user));
    console.log("Drivers Dumped to cache:", Drivers);
    return Drivers;
  } catch (error) {
    console.error("Error getting geospatial data:", error);
  }
}

export async function setDistanceTime(time, distance, id) {
  const data = {
    time,
    distance,
    id,
  };
  const jsonString = JSON.stringify(data);

  if (!id == "") {
    await redis.set(`distanceTime_${id}`, jsonString);
  }
}

export async function getDistanceTime(id) {
  const result = await redis.get(`distanceTime_${id}`);
  // console.log("getDriverRealTimeLocation===> cluster===>",result)
  return result;
}

// Run the example functions
// addGeospatialData();
// getGeospatialData();
