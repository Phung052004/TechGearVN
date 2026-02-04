const Order = require("../models/Order");
const Product = require("../models/Product");

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  // Monday as first day
  const x = startOfDay(d);
  const day = x.getDay(); // 0 (Sun) ... 6 (Sat)
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x;
}

async function getOverview({ lowStockThreshold = 5 } = {}) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const paidMatch = {
    paymentStatus: "PAID",
    orderStatus: { $ne: "CANCELLED" },
  };

  const [today, week, month] = await Promise.all([
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: dayStart } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),
    Order.aggregate([
      { $match: { ...paidMatch, createdAt: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$finalAmount" },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  const topProducts = await Order.aggregate([
    { $match: { ...paidMatch, createdAt: { $gte: monthStart } } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        productName: { $first: "$items.productName" },
        quantity: { $sum: "$items.quantity" },
        revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 8 },
  ]);

  const lowStockProducts = await Product.find({
    stockQuantity: { $lte: Number(lowStockThreshold) || 5 },
  })
    .select("name stockQuantity price status")
    .sort({ stockQuantity: 1, updatedAt: -1 })
    .limit(10);

  return {
    revenue: {
      today: Number(today?.[0]?.revenue || 0),
      thisWeek: Number(week?.[0]?.revenue || 0),
      thisMonth: Number(month?.[0]?.revenue || 0),
    },
    orders: {
      today: Number(today?.[0]?.orders || 0),
      thisWeek: Number(week?.[0]?.orders || 0),
      thisMonth: Number(month?.[0]?.orders || 0),
    },
    topProducts,
    lowStockProducts,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { getOverview };
