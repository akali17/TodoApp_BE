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
    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    // Xác định thứ tự column
    const columnCount = await Column.countDocuments({ board: boardId });

    const column = await Column.create({
      title,
      board: boardId,
      createdBy: req.user.id,
      order: columnCount
    });

    // Ghi Activity
    await Activity.create({
      boardId: boardId,          // FIXED
      userId: req.user.id,
      action: "CREATE_COLUMN",
      detail: `Created column "${column.title}"`,
    });

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: boardId })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${boardId}`).emit("activity:updated", { activity: activities });
    }

    // 🔥 REALTIME: Emit column:created
    console.log(`🔥 EMITTING column:created to room board:${boardId}`);
    console.log("🔥 req.io exists:", !!req.io);
    
    if (req.io) {
      req.io.to(`board:${boardId}`).emit("column:created", { column });
    } else {
      console.error("❌ req.io is undefined!");
    }

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

    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    column.title = title;
    column.updatedBy = req.user.id;
    await column.save();

    // Log activity
    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_COLUMN",
      detail: `Updated column to "${title}"`,
    });

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: board._id })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${board._id}`).emit("activity:updated", { activity: activities });
    }

    // 🔥 REALTIME: Emit column:updated
    console.log(`🔥 EMITTING column:updated to room board:${board._id}`);
    console.log("🔥 req.io exists:", !!req.io);
    
    if (req.io) {
      req.io.to(`board:${board._id}`).emit("column:updated", { column });
    } else {
      console.error("❌ req.io is undefined!");
    }

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

    if (!board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this board" });
    }

    const columnId = column._id;
    const columnTitle = column.title;

    await column.deleteOne();

    // Log activity
    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "DELETE_COLUMN",
      detail: `Deleted column "${columnTitle}"`,
    });

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: board._id })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${board._id}`).emit("activity:updated", { activity: activities });
    }

    // 🔥 REALTIME: Emit column:deleted
    console.log(`🔥 EMITTING column:deleted to room board:${board._id}`);
    console.log("🔥 req.io exists:", !!req.io);
    
    if (req.io) {
      req.io.to(`board:${board._id}`).emit("column:deleted", { columnId });
    } else {
      console.error("❌ req.io is undefined!");
    }

    res.json({ message: "Column deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
//reoder columns
exports.reorderColumns = async (req, res) => {
  try {
    const { boardId, reorderedColumnIds } = req.body;

    // Board check
    const board = await Board.findById(boardId);
    if (!board || !board.members.includes(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Update order theo mảng mới
    await Promise.all(
      reorderedColumnIds.map((colId, index) =>
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

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${boardId}`).emit("activity:updated", { activity: activities });
    }

    // 🔥 REALTIME: Emit columns:reordered
    console.log(`🔥 EMITTING columns:reordered to room board:${boardId}`);
    console.log("🔥 req.io exists:", !!req.io);
    
    if (req.io) {
      req.io.to(`board:${boardId}`).emit("columns:reordered", { reorderedColumnIds });
    } else {
      console.error("❌ req.io is undefined!");
    }

    res.json({ message: "Columns reordered" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

