const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const {
  createBoard,
  getMyBoards,
  getBoardById,
  addMember,
  getBoardMembers,
  removeMember,
  getFullBoard
} = require("../controllers/boardController");

// POST api/boards/
router.post("/", auth, createBoard);

// GET api/boards/
router.get("/",   auth, getMyBoards);

// GET api/boards/:id
router.get("/:id", auth, getBoardById);

// add members
router.post("/:id/add-member", auth, addMember);

//get members
router.get("/:id/members", auth, getBoardMembers);

//remove members
router.delete("/:id/remove-member", auth, removeMember);
// get full board data
router.get("/:id/full", auth, getFullBoard);

module.exports = router;
