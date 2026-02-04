const User = require("../models/User");
const { createHttpError } = require("../utils/httpError");

function normalize(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getMyProfile(userFromMiddleware) {
  return userFromMiddleware;
}

async function updateMyProfile(
  userId,
  { fullName, email, phone, address, provinceCity },
) {
  const nextFullName = normalize(fullName);
  const nextEmail = normalize(email);
  const nextPhone = normalize(phone);
  const nextAddress = normalize(address);
  const nextProvinceCity = normalize(provinceCity);

  const user = await User.findById(userId);
  if (!user) throw createHttpError(404, "Không tìm thấy user");

  if (nextEmail && nextEmail !== user.email) {
    const emailExists = await User.findOne({
      email: nextEmail,
      _id: { $ne: user._id },
    });
    if (emailExists) throw createHttpError(400, "Email đã được sử dụng");
    user.email = nextEmail;
  }

  if (nextFullName) user.fullName = nextFullName;
  if (nextPhone) user.phone = nextPhone;
  if (nextAddress) user.address = nextAddress;
  if (nextProvinceCity) user.provinceCity = nextProvinceCity;

  const updated = await user.save();
  const safeUser = await User.findById(updated._id).select("-password");
  return safeUser;
}

module.exports = { getMyProfile, updateMyProfile };
