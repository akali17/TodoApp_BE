const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns
} = require("../controllers/columnController");

router.post("/", auth, createColumn);              // Create
router.put("/:id", auth, updateColumn);            // Update
router.delete("/:id", auth, deleteColumn);         // Delete
router.post("/reorder", auth, reorderColumns);   // Reorder


module.exports = router;
