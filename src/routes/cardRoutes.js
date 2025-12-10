const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const CardController = require("../controllers/cardController");

router.post("/", auth, CardController.createCard);
router.get("/column/:columnId", auth, CardController.getCardsByColumn);
router.get("/:id", auth, CardController.getCardDetail);
router.put("/:id", auth, CardController.updateCard);
router.get("/board/:boardId/cards", auth, CardController.getAllCardsInBoard);
router.delete("/:id", auth, CardController.deleteCard);

router.patch("/:cardId/move", auth, CardController.moveCard);
router.patch("/reorder", auth, CardController.reorderCardsInColumn);

router.post("/:cardId/members", auth, CardController.addMemberToCard);
router.delete("/:cardId/members/:userId", auth, CardController.removeMemberFromCard);

module.exports = router;
