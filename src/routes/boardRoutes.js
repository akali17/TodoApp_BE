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
  getFullBoard,
  updateBoard,
  inviteMember,
  acceptInvite,
  deleteBoard,
  leaveBoard
} = require("../controllers/boardController");

// POST api/boards/
router.post("/", auth, createBoard);

// GET api/boards/
router.get("/",   auth, getMyBoards);

// GET api/boards/:id
router.get("/:id", auth, getBoardById);

// update board

router.put("/:id", auth, updateBoard);

// add members
router.post("/:id/add-member", auth, addMember);

//get members
router.get("/:id/members", auth, getBoardMembers);


//remove members
router.post("/:id/remove-member", auth, removeMember);
// Leave board (member leaves)
router.post("/:id/leave", auth, leaveBoard);

// Delete board (owner only)
router.delete("/:id", auth, deleteBoard);
// Invite member by email
router.post("/:id/invite", auth, inviteMember);

// Accept invite (requires auth to verify user)
router.post("/accept-invite", auth, acceptInvite);

// get full board data
router.get("/:id/full", auth, getFullBoard);

module.exports = router;
