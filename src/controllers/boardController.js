const Board = require("../models/Board");
const Column = require("../models/Column");
const Card = require("../models/Card");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Tạo board
exports.createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    const board = await Board.create({
      title,
      description,
      owner: req.user.id,
      members: [req.user.id],
    });

    res.status(201).json({ message: "Board created", board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tất cả board user tham gia
exports.getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      members: req.user.id,
    });

    res.json({ boards });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET board by ID (chỉ member mới xem được)
exports.getBoardById = async (req, res) => {
  try {
    const boardId = req.params.id;

    const board = await Board.findById(boardId).populate("members");

    if (!board) return res.status(404).json({ message: "Board not found" });

    const isMember = board.members.some(
      (member) => member._id.toString() === req.user.id
    );

    if (!isMember && board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(board);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Thêm thành viên
exports.addMember = async (req, res) => {
  try {
    const boardId = req.params.id;
    const { email } = req.body;

    // 1. Lấy board
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // 2. Kiểm tra quyền: chỉ owner mới thêm được thành viên
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not the owner of this board" });
    }

    // 3. Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 4. Không cho thêm owner chính mình
    if (user._id.toString() === board.owner.toString()) {
      return res.status(400).json({ message: "Owner is already a member" });
    }

    // 5. Check trùng thành viên
    if (board.members.includes(user._id)) {
      return res.status(400).json({ message: "User already added" });
    }

    // 6. Thêm vào members[]
    board.members.push(user._id);
    await board.save();

    // 7. Ghi activity
    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "ADD_MEMBER",
      detail: `Added member "${user.username}" to board "${board.title}"`
    });

      // 8. Notification cho user được thêm
    await Notification.create({
      user: user._id,
      sender: req.user.id,
      boardId: board._id,
      type: "ADD_TO_BOARD",
      message: `${req.user.username || "Someone"} added you to board "${board.title}".`
    });

    res.json({ message: "Member added successfully", board });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Xoá thành viên
exports.removeMember = async (req, res) => {
  try {
    const boardId = req.params.id;
    const { email } = req.body;

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    board.members = board.members.filter(
      (m) => m.toString() !== user._id.toString()
    );

    await board.save();

    res.json({ message: "Member removed" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// GET full board detail
exports.getFullBoard = async (req, res) => {
  try {
    const boardId = req.params.id;

    // 1. Lấy board + populate owner & members
    const board = await Board.findById(boardId)
      .populate("owner", "username email avatar")
      .populate("members", "username email avatar");

    if (!board)
      return res.status(404).json({ message: "Board not found" });

    // 2. Check user có phải member không
    const isMember =
      board.owner._id.toString() === req.user.id ||
      board.members.some(m => m._id.toString() === req.user.id);

    if (!isMember)
      return res.status(403).json({ message: "Access denied" });

    // 3. Lấy columns của board
    const columns = await Column.find({ board: boardId })
      .sort({ order: 1 });

    // 4. Lấy cards thuộc board
    const cards = await Card.find({ board: boardId })
      .populate("members", "username email avatar")
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .sort({ order: 1 });

    // 5. (Optional) Get activity log
    const activity = await Activity.find({ boardId })
      .populate("userId", "username email avatar")
      .sort({ createdAt: -1 })
      .limit(30);

    // 6. Trả về dữ liệu
    res.json({
      board,
      columns,
      cards,
      activity
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// Lấy danh sách thành viên board
exports.getBoardMembers = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("members", "username email avatar")
      .populate("owner", "username email avatar");

    if (!board)
      return res.status(404).json({ message: "Board not found" });

    const isMember =
      board.owner._id.toString() === req.user.id ||
      board.members.some(m => m._id.toString() === req.user.id);

    if (!isMember)
      return res.status(403).json({ message: "Access denied" });

    res.json({
      owner: board.owner,
      members: board.members
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

