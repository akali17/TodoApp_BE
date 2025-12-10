const Board = require("../models/Board");
const Card = require("../models/Card");
const Column = require("../models/Column");
const Activity = require("../models/Activity");

// Kiểm tra user có trong board không
const isBoardMember = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  return board.members.includes(userId) ? board : null;
};
// create card
exports.createCard = async (req, res) => {
  try {
    const { title, description, deadline, columnId } = req.body;

    const column = await Column.findById(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const board = await isBoardMember(column.board, req.user.id);
    if (!board) return res.status(403).json({ message: "Not allowed" });

    const cardCount = await Card.countDocuments({ column: columnId });

    const card = await Card.create({
      title,
      description,
      deadline,
      board: board._id,
      column: columnId,
      createdBy: req.user.id,
      order: cardCount
    });

    // Activity Log
    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "CREATE_CARD",
      detail: `Created card "${title}"`
    });

    res.status(201).json({ message: "Card created", card });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// get card by column
exports.getCardsByColumn = async (req, res) => {
  try {
    const { columnId } = req.params;

    const column = await Column.findById(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const board = await isBoardMember(column.board, req.user.id);
    if (!board) return res.status(403).json({ message: "Not allowed" });

    const cards = await Card.find({ column: columnId }).sort({ order: 1 });

    res.json({ cards });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// get card detail
exports.getCardDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id)
      .populate("members", "username email avatar")
      .populate("createdBy", "username")
      .populate("updatedBy", "username");

    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await isBoardMember(card.board, req.user.id);
    if (!board) return res.status(403).json({ message: "Not allowed" });

    res.json(card);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// update card
exports.updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, deadline, isDone } = req.body;

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await isBoardMember(card.board, req.user.id);
    if (!board) return res.status(403).json({ message: "Not allowed" });

    if (title) card.title = title;
    if (description) card.description = description;
    if (deadline) card.deadline = deadline;
    if (isDone !== undefined) card.isDone = isDone;

    card.updatedBy = req.user.id;
    await card.save();

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_CARD",
      detail: `Updated card "${card.title}"`
    });

    res.json({ message: "Card updated", card });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// delete card
exports.deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await isBoardMember(card.board, req.user.id);
    if (!board) return res.status(403).json({ message: "Not allowed" });

    await card.deleteOne();

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "DELETE_CARD",
      detail: `Deleted card "${card.title}"`
    });

    res.json({ message: "Card deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// assign member to card
exports.addMemberToCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { email } = req.body;

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await Board.findById(card.board);
    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // Check user is board member
    if (!board.members.includes(user._id))
      return res.status(400).json({ message: "User is not in this board" });

    // Add member to card
    if (!card.members.includes(user._id)) {
      card.members.push(user._id);
      await card.save();
    }

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_CARD",
      detail: `Added member ${user.username} to card "${card.title}"`
    });
    await Notification.create({
      userId: user._id,
      cardId: card._id,
      boardId: board._id,
      message: `You were added to card "${card.title}" in board "${board.title}"`
    });

    res.json({ message: "Member added", card });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// move card
exports.moveCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { toColumn, newOrder } = req.body;

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await Board.findById(card.board);
    if (!board.members.includes(req.user.id))
      return res.status(403).json({ message: "Not allowed" });

    const oldColumn = card.column;

    // Nếu chuyển column → reorder column cũ
    if (oldColumn !== toColumn) {
      const oldCards = await Card.find({ column: oldColumn }).sort({ order: 1 });

      const filtered = oldCards.filter(c => c._id.toString() !== cardId);

      await Promise.all(
        filtered.map((c, index) =>
          Card.findByIdAndUpdate(c._id, { order: index })
        )
      );
    }

    // Update card sang column mới
    card.column = toColumn;
    card.order = newOrder;
    card.updatedBy = req.user.id;
    await card.save();

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_CARD",
      detail: `Moved card "${card.title}" to another column`
    });

    res.json({ message: "Card moved", card });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// remove member from card
exports.removeMemberFromCard = async (req, res) => {
  try {
    const { cardId, userId } = req.params;

    const card = await Card.findById(cardId);
    if (!card) return res.status(404).json({ message: "Card not found" });

    const board = await Board.findById(card.board);
    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    card.members = card.members.filter(id => id.toString() !== userId);

    await card.save();
    await Activity.create({
    boardId: board._id,
    userId: req.user.id,
    action: "UPDATE_CARD",
    detail: `Removed member ${removedUser.username} from card "${card.title}"`
    });

    res.json({ message: "Member removed", card });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET all cards in board
exports.getAllCardsInBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    // Check board tồn tại
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // Check permission
    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Lấy tất cả columns thuộc board này
    const columns = await Column.find({ board: boardId }).sort({ order: 1 });

    // Lấy tất cả cards thuộc board (không cần query nhiều lần)
    const cards = await Card.find({ board: boardId })
      .populate("members", "username email avatar")
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .sort({ order: 1 });

    // Group cards theo column
    const grouped = columns.map(c => ({
      columnId: c._id,
      title: c.title,
      order: c.order,
      cards: cards.filter(card => card.column.toString() === c._id.toString())
    }));

    res.json({
      boardId,
      columns: grouped
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//reoder cards in column
exports.reorderCardsInColumn = async (req, res) => {
  try {
    const { columnId, orderedCardIds } = req.body;

    const column = await Column.findById(columnId);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const board = await Board.findById(column.board);
    if (!board.members.includes(req.user.id))
      return res.status(403).json({ message: "Not allowed" });

    await Promise.all(
      orderedCardIds.map((id, index) =>
        Card.findByIdAndUpdate(id, { order: index })
      )
    );

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_CARD",
      detail: "Reordered cards in column"
    });

    res.json({ message: "Cards reordered" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
