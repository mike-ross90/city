import { config } from "dotenv";

const dbConfig = {
  // MongoDB connection string
  db:
    config().parsed.dbURI ||
    "mongodb+srv://supportsuitch:ZWmiqT7GznbvBdgu@cluster0.jpv3wtl.mongodb.net/citycarriage",
};

export default dbConfig;
