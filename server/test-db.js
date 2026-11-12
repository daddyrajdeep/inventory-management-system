
import dns from "node:dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const testDB = async () => {
  try {
    console.log("Testing MongoDB connection...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully!");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    await mongoose.disconnect();
    console.log("Database Test Completed!");

    process.exit(0);
  } catch (error) {
    console.error("MongoDB Connection Failed!");
    console.error(error.message);
    process.exit(1);
  }
};

testDB();
