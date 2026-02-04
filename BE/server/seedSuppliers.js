/* file: server/seedSuppliers.js */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Supplier = require("./models/Supplier");

async function seedSuppliers() {
  if (!process.env.MONGO_URI) {
    console.warn(
      "⚠️  MONGO_URI is missing. Using fallback mongodb://localhost:27017/TechGearDB",
    );
    process.env.MONGO_URI = "mongodb://localhost:27017/TechGearDB";
  }

  await connectDB();
  console.log("✅ Connected DB");

  const suppliers = [
    {
      name: "TechGear Distribution",
      contactPerson: "Nguyễn Văn A",
      phone: "0900000001",
      email: "contact@techgear-distribution.vn",
      address: "Hà Nội",
    },
    {
      name: "VietParts Supplier",
      contactPerson: "Trần Thị B",
      phone: "0900000002",
      email: "sales@vietparts.vn",
      address: "TP. Hồ Chí Minh",
    },
    {
      name: "PC Hub Wholesale",
      contactPerson: "Lê Văn C",
      phone: "0900000003",
      email: "support@pchub.vn",
      address: "Đà Nẵng",
    },
  ];

  let upserted = 0;
  for (const s of suppliers) {
    const doc = await Supplier.findOneAndUpdate(
      { name: s.name },
      { $set: s },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (doc) upserted += 1;
  }

  const total = await Supplier.countDocuments();
  console.log(`✅ Seeded/updated ${upserted} suppliers. Total: ${total}`);

  await mongoose.connection.close();
}

seedSuppliers().catch(async (err) => {
  console.error("❌ seedSuppliers failed:", err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
