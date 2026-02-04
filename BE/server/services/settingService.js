const Setting = require("../models/Setting");
const { createHttpError } = require("../utils/httpError");

async function getPublicSettings() {
  const doc = await Setting.findOne({ key: "default" });
  if (doc) return doc;

  // Create a sane default doc so FE can always fetch.
  const created = await Setting.create({
    key: "default",
    shippingFee: 0,
    footer: {
      aboutText:
        "Trang thương mại chính thức của TechGearVN. Luôn tìm kiếm những sản phẩm PC, văn phòng chất lượng.",
      addresses: [
        "CS1: 83 - 85 Thái Hà - Đống Đa - HN",
        "CS2: Vinhomes - Phường 15 - Q9 - TP.HCM",
      ],
      hotline: "098.655.2233",
      email: "TechGearVN@gmail.com",
      companyLine1:
        "Bản quyền của Công ty cổ phần Mocato Việt Nam - Trụ sở: 248 Phú Viên, Bồ Đề, Long Biên, Hà Nội.",
      companyLine2:
        "GPDKKD: 0109787586 do Sở Kế Hoạch và Đầu Tư Hà Nội cấp ngày 22/10/2021",
    },
  });

  return created;
}

function normalizeString(v) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

async function updateSettings(patch = {}) {
  const shippingFeeRaw = patch?.shippingFee;
  const shippingFee =
    shippingFeeRaw === undefined || shippingFeeRaw === null
      ? undefined
      : Number(shippingFeeRaw);

  if (shippingFee !== undefined) {
    if (!Number.isFinite(shippingFee) || shippingFee < 0) {
      throw createHttpError(400, "shippingFee không hợp lệ");
    }
  }

  const footer = patch?.footer ?? {};
  const nextFooter = {
    aboutText: normalizeString(footer?.aboutText),
    hotline: normalizeString(footer?.hotline),
    email: normalizeString(footer?.email),
    companyLine1: normalizeString(footer?.companyLine1),
    companyLine2: normalizeString(footer?.companyLine2),
    addresses: Array.isArray(footer?.addresses)
      ? footer.addresses.map((a) => String(a ?? "").trim()).filter(Boolean)
      : undefined,
  };

  const update = {};
  if (shippingFee !== undefined) update.shippingFee = shippingFee;

  // Only set footer fields that were provided
  for (const [k, v] of Object.entries(nextFooter)) {
    if (v !== null && v !== undefined) {
      update[`footer.${k}`] = v;
    }
  }

  const doc = await Setting.findOneAndUpdate(
    { key: "default" },
    { $set: update, $setOnInsert: { key: "default" } },
    { upsert: true, new: true, runValidators: true },
  );

  return doc;
}

module.exports = { getPublicSettings, updateSettings };
