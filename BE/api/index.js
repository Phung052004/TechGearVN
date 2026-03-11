const path = require("path");
const dotenv = require("dotenv");

const connectDB = require("../server/config/db");
const app = require("../app");

// Load local .env only when not running on Vercel/production
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", "server", ".env") });
}

module.exports = async (req, res) => {
  try {
    await connectDB();

    // Support both direct '/api/v1/*' and rewrites that strip the prefix
    if (!req.url.startsWith("/api/v1") && req.url !== "/") {
      req.url = `/api/v1${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }

    return app(req, res);
  } catch (err) {
    console.error("API handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");

    const shouldExpose = String(process.env.DEBUG_ERRORS || "").toLowerCase() === "true";
    const payload = { message: "Internal Server Error" };
    if (shouldExpose) {
      payload.error = {
        name: err?.name,
        message: err?.message,
        code: err?.code,
      };
    }

    res.end(JSON.stringify(payload));
  }
};
