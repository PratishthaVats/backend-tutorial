import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas cluster using MONGODB_URI environment variable.
 * Does not expose connection string or credentials in logs.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined in the environment variables. Please check your .env file."
    );
  }

  try {
    const connectionInstance = await mongoose.connect(uri);
    console.log(
      `[DATABASE] Connected to MongoDB host: ${connectionInstance.connection.host}`
    );
    return connectionInstance;
  } catch (error) {
    console.error(`[DATABASE ERROR] MongoDB connection failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
