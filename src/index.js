import dotenv from "dotenv";
import connectDB from "./db/database.js";
import app from "./app.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

/**
 * Initialize MongoDB connection first, then start HTTP server
 */
const startServer = async () => {
  try {
    console.log("[SERVER] Attempting to connect to MongoDB Atlas...");
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`[SERVER] HTTP Server is listening on http://localhost:${PORT}`);
      console.log(`[SERVER] Health check available at: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (error) {
    console.error("[SERVER FATAL] Failed to initialize backend server:", error.message);
    process.exit(1);
  }
};

startServer();
