const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const { getBoardStats, getActivityStats, getCardsWithDeadlines } = require("../controllers/statsController");

// Get board statistics
router.get("/board-stats", auth, getBoardStats);

// Get activity statistics
router.get("/activity-stats", auth, getActivityStats);

// Get all cards with deadlines
router.get("/cards-with-deadlines", auth, getCardsWithDeadlines);

module.exports = router;
