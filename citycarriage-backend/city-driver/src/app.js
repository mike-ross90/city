// // Libraries
// import bodyParser from "body-parser";
// import cors from "cors";
// import express from "express";
// import morgan from "morgan";
// import http from "http";
// import { Server } from "socket.io";

// import os from "os";
// import actionSockets from "./sockets/actionSockets.js";
// import driverSockets from "./sockets/driverSockets.js";
// import locationSocketsRedis from "./sockets/locationSocketsRedis.js";
// import userSockets from "./sockets/userSockets.js";
// import { connectDB } from "./DB/index.js";
// import rideSockets from "./sockets/rideSockets.js";

// // const numCPUs = os.cpus().length;
// const port = process.env.PORT || 9100;

// // Workers can share any TCP connection
// // In this case, it will be an HTTP server
// let app = express();

// var corsOptions = {
//   origin: "*",
// };
// app.use(cors(corsOptions));

// app.use(bodyParser.json());
// // Configure body-parser to handle post requests
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(morgan("dev"));

// app.get("/", (req, res) => {
//   res.status(200).json("Welcome to city-carriage driver live");
// });

// // Connect to the database
// connectDB();

// const httpServer = http.createServer(app);
// const io = new Server(httpServer);

// // ACTIONS SOCKETS
// actionSockets(io);

// // LOCATION SOCKETS
// // locationSockets.locationSockets(io)
// locationSocketsRedis(io);

// // DRIVER SOCKETS
// driverSockets(io);

// // RIDE SOCKETS
// rideSockets(io);

// userSockets(io);

// httpServer.listen(port, async () => {
//   console.log(`Worker ${process.pid} listening on ${port}`);
// });
import express from "express";
import http from "http";
import { Server } from "socket.io";

import os from "os";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";

import mongoose from "mongoose";
import { connectDB } from "./DB/index.js";

import actionSockets from "./sockets/actionSockets.js";
import driverSockets from "./sockets/driverSockets.js";
import locationSocketsRedis from "./sockets/locationSocketsRedis.js";
import userSockets from "./sockets/userSockets.js";
import rideSockets from "./sockets/rideSockets.js";

// const numCPUs = os.cpus().length;
const port = process.env.PORT || 9100;

// Workers can share any TCP connection
// In this case, it will be an HTTP server
let app = express();

var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
// Configure body-parser to handle post requests
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json("Welcome to city-carriage driver live");
});

// Connect to the database
connectDB();

const httpServer = http.createServer(app);
const io = new Server(httpServer);

// ACTIONS SOCKETS
actionSockets(io);

// LOCATION SOCKETS
// locationSockets.locationSockets(io)
locationSocketsRedis(io);

// DRIVER SOCKETS
driverSockets(io);

// RIDE SOCKETS
rideSockets(io);

userSockets(io);

httpServer.listen(port, async () => {
  console.log(`Worker ${process.pid} listening on ${port}`);
});
