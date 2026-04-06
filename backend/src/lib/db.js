import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDB = async () => {
  try {
    if (!ENV.DB_URL) {
      throw new Error("Please provide DB_URL in the environment variables");
    }
    const conn = await mongoose.connect(ENV.DB_URL);
    console.log("✅ MongoDB Connected:", conn.connection.host);
  } catch (error) {
    console.log(`Error: ${error.message}`);
    process.exit(1);
  }
};
