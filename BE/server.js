const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./server/config/db");

// Config
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "server", ".env") });
}

const app = require("./app");

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
