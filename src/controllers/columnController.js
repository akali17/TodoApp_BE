const Column = require("../models/Column");
const Board = require("../models/Board");
const Activity = require("../models/Activity");

// ======================
//  CREATE COLUMN
// ======================
exports.createColumn = async (req, res) => {
  try {
    const { boardId, title } = req.body;

    // Check board tồn tại
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // User không phải member
    if (!board.members.includes(req.userId)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    // Xác định thứ tự column
    const columnCount = await Column.countDocuments({ board: boardId });

    const column = await Column.create({
      title,
      board: boardId,
      createdBy: req.userId,
      order: columnCount
    });

    // Ghi Activity
    await Activity.create({
      boardId: boardId,          // FIXED
      userId: req.userId,
      action: "CREATE_COLUMN",
      detail: `Created column "${column.title}"`,
    });

    res.status(201).json({ message: "Column created", column });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
//  UPDATE COLUMN
// ======================
exports.updateColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const column = await Column.findById(id);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const board = await Board.findById(column.board);

    if (!board.members.includes(req.userId)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    column.title = title;
    column.updatedBy = req.userId;
    await column.save();

    // Log activity
    await Activity.create({
      boardId: board._id,
      userId: req.userId,
      action: "UPDATE_COLUMN",
      detail: `Updated column to "${title}"`,
    });

    res.json({ message: "Column updated", column });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ======================
//  DELETE COLUMN
// ======================
exports.deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;

    const column = await Column.findById(id);
    if (!column) return res.status(404).json({ message: "Column not found" });

    const board = await Board.findById(column.board);

    if (!board.members.includes(req.userId)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    await column.deleteOne();

    // Log activity
    await Activity.create({
      boardId: board._id,
      userId: req.userId,
      action: "DELETE_COLUMN",
      detail: `Deleted column "${column.title}"`,
    });

    res.json({ message: "Column deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//reoder columns
exports.reorderColumns = async (req, res) => {
  try {
    const { boardId, orderedColumnIds } = req.body;

    // Board check
    const board = await Board.findById(boardId);
    if (!board || !board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Update order theo mảng mới
    await Promise.all(
      orderedColumnIds.map((colId, index) =>
        Column.findByIdAndUpdate(colId, { order: index })
      )
    );

    // Activity log
    await Activity.create({
      boardId,
      userId: req.user.id,
      action: "UPDATE_COLUMN",
      detail: "Reordered columns"
    });

    res.json({ message: "Columns reordered" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

