const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createColumn,
  updateColumn,
  deleteColumn
} = require("../controllers/columnController");

router.post("/", auth, createColumn);              // Create
router.put("/:id", auth, updateColumn);            // Update
router.delete("/:id", auth, deleteColumn);         // Delete

module.exports = router;
