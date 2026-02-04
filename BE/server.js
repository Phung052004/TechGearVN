const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./server/config/db");

// Config
dotenv.config({ path: path.join(__dirname, "server", ".env") });
connectDB(); // Kết nối DB

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Đọc được JSON từ body request

// Routes
app.use("/api/auth", require("./server/routes/authRoutes"));
app.use("/api/users", require("./server/routes/userRoutes"));
app.use("/api/products", require("./server/routes/productRoutes"));
app.use("/api/categories", require("./server/routes/categoryRoutes"));
app.use("/api/brands", require("./server/routes/brandRoutes"));

app.use("/api/carts", require("./server/routes/cartRoutes"));
app.use("/api/orders", require("./server/routes/orderRoutes"));
app.use("/api/saved-builds", require("./server/routes/savedBuildRoutes"));

app.use("/api/vouchers", require("./server/routes/voucherRoutes"));
app.use("/api/banners", require("./server/routes/bannerRoutes"));
app.use("/api/settings", require("./server/routes/settingRoutes"));
app.use("/api/admin", require("./server/routes/adminRoutes"));
app.use("/api/articles", require("./server/routes/articleRoutes"));
app.use("/api/reviews", require("./server/routes/reviewRoutes"));
app.use("/api/warranty-claims", require("./server/routes/warrantyRoutes"));

app.use("/api/payments", require("./server/routes/paymentRoutes"));

app.use("/api/suppliers", require("./server/routes/supplierRoutes"));
app.use("/api/import-receipts", require("./server/routes/importReceiptRoutes"));

app.use("/api/chat", require("./server/routes/chatRoutes"));

// Default Route
app.get("/", (req, res) => {
  res.send("API TechGear đang chạy...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));
