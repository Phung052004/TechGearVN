const express = require("express");
const cors = require("cors");
const path = require("path");

const API_PREFIX = "/api/v1";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use(`${API_PREFIX}/auth`, require("./server/routes/authRoutes"));
app.use(`${API_PREFIX}/users`, require("./server/routes/userRoutes"));
app.use(`${API_PREFIX}/products`, require("./server/routes/productRoutes"));
app.use(`${API_PREFIX}/categories`, require("./server/routes/categoryRoutes"));
app.use(`${API_PREFIX}/brands`, require("./server/routes/brandRoutes"));

app.use(`${API_PREFIX}/carts`, require("./server/routes/cartRoutes"));
app.use(`${API_PREFIX}/orders`, require("./server/routes/orderRoutes"));
app.use(
  `${API_PREFIX}/saved-builds`,
  require("./server/routes/savedBuildRoutes"),
);

app.use(`${API_PREFIX}/vouchers`, require("./server/routes/voucherRoutes"));
app.use(`${API_PREFIX}/banners`, require("./server/routes/bannerRoutes"));
app.use(`${API_PREFIX}/settings`, require("./server/routes/settingRoutes"));
app.use(`${API_PREFIX}/admin`, require("./server/routes/adminRoutes"));
app.use(`${API_PREFIX}/articles`, require("./server/routes/articleRoutes"));
app.use(`${API_PREFIX}/reviews`, require("./server/routes/reviewRoutes"));
app.use(
  `${API_PREFIX}/warranty-claims`,
  require("./server/routes/warrantyRoutes"),
);

app.use(`${API_PREFIX}/payments`, require("./server/routes/paymentRoutes"));

app.use(`${API_PREFIX}/suppliers`, require("./server/routes/supplierRoutes"));
app.use(
  `${API_PREFIX}/import-receipts`,
  require("./server/routes/importReceiptRoutes"),
);

app.use(`${API_PREFIX}/chat`, require("./server/routes/chatRoutes"));
app.use(`${API_PREFIX}/images`, require("./server/routes/imageRoutes"));

// Default route
app.get("/", (req, res) => {
  res.send("API TechGear đang chạy...");
});

module.exports = app;
