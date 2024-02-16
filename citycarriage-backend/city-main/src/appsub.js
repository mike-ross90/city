import bodyParser from "body-parser";
import morganBody from "morgan-body";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { ResHandler } from "./Utils/ResponseHandler/ResHandler.js";
import { PaymentRouters } from "./Router/PaymentRouters.js";
import { ReviewRouters } from "./Router/ReviewRouters.js";
import { AdminRouters } from "./Router/AdminRouters.js";
import { AuthRouters } from "./Router/AuthRouters.js";
import { connectDB } from "./DB/index.js";
import { fileURLToPath } from "url";

export const filename = fileURLToPath(import.meta.url);
export const dirname = path.dirname(filename);

export let app = express();

// const API_PreFix = "/api/v1";

app.use("/", express.static("Uploads"));
var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.status(200).json("Welcome to city-carriage main live");
});

morganBody(app, {
  prettify: true,
  logReqUserAgent: true,
  logReqDateTime: true,
});
connectDB();

// Running Seeder
// RunSeeder();

app.use(AuthRouters);
app.use(AdminRouters);
app.use(PaymentRouters);
app.use(ReviewRouters);
app.use(ResHandler);
