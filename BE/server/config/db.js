const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    // Reuse existing connection in serverless environments
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // Cache across hot reloads / lambda invocations
    global.__MONGOOSE_CONN__ = global.__MONGOOSE_CONN__ ?? null;
    if (global.__MONGOOSE_CONN__) {
      return global.__MONGOOSE_CONN__;
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Fail fast in serverless to avoid long hanging requests.
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    global.__MONGOOSE_CONN__ = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
