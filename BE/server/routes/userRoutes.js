const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController");

const {
  listUsers,
  createUser,
  setUserBlocked,
  setUserRole,
} = require("../controllers/userAdminController");

router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);

// ADMIN user management
router.get("/", protect, authorize("ADMIN"), listUsers);
router.post("/", protect, authorize("ADMIN"), createUser);
router.patch("/:id/block", protect, authorize("ADMIN"), setUserBlocked);
router.patch("/:id/role", protect, authorize("ADMIN"), setUserRole);

module.exports = router;
