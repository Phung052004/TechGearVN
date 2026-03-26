const express = require("express");
const router = express.Router();

const {
  getMyBuilds,
  createBuild,
  getBuildByIdOrShare,
  getBuildByShareLink,
  updateBuild,
  deleteBuild,
} = require("../controllers/savedBuildController");

const { protect } = require("../middleware/authMiddleware");

router.get("/shared/:shareLink", getBuildByShareLink);

router.get("/me", protect, getMyBuilds);
router.post("/", protect, createBuild);
router.get("/:idOrShare", protect, getBuildByIdOrShare);
router.put("/:id", protect, updateBuild);
router.delete("/:id", protect, deleteBuild);

module.exports = router;
