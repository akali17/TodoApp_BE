const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createBoard,
  getMyBoards,
  getBoardById
} = require("../controllers/boardController");

// POST api/boards/
router.post("/", auth, createBoard);

// GET api/boards/
router.get("/", auth, getMyBoards);

// GET api/boards/:id
router.get("/:id", auth, getBoardById);

module.exports = router;
