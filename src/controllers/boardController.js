const Board = require("../models/Board");
const Column = require("../models/Column");
const Card = require("../models/Card");
const Activity = require("../models/Activity");
const User = require("../models/User");
const Notification = require("../models/Notification");
const InviteToken = require("../models/InviteToken");

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

// Cập nhật title/description board 

// PUT /api/boards/:id
exports.updateBoard = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim())
      return res.status(400).json({ message: "Title is required" });

    const board = await Board.findById(req.params.id);
    if (!board)
      return res.status(404).json({ message: "Board not found" });

    const isMember = board.members.some(
      m => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );
    if (!isMember)
      return res.status(403).json({ message: "Not allowed" });

    board.title = title.trim();
    if (description !== undefined) {
      board.description = description.trim();
    }
    await board.save();

    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "UPDATE_BOARD",
      detail: `Updated board`
    });

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: board._id })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${board._id}`).emit("activity:updated", { activity: activities });
    }

    // 🔥 REALTIME
    if (req.io) {
      req.io.to(`board:${board._id}`).emit("board:updated", {
        title: board.title,
        description: board.description,
      });
    } else {
      console.error("❌ req.io is undefined!");
    }

    res.json(board);

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
    const { email, userId } = req.body;

    // 1. Lấy board
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    // 2. Kiểm tra quyền: chỉ owner mới thêm được thành viên
    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not the owner of this board" });
    }

    // 3. Tìm user theo userId hoặc email
    let user;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    }
    
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

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: board._id })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${board._id}`).emit("activity:updated", { activity: activities });
    }

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
    const { userId } = req.body;

    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ message: "Board not found" });

    if (board.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only owner can remove members" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Không cho remove owner
    if (user._id.toString() === board.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove board owner" });
    }

    // Check user có phải member không
    const isMember = board.members.some(m => m.toString() === user._id.toString());
    if (!isMember) {
      return res.status(400).json({ message: "User is not a member" });
    }

    // Remove khỏi board.members
    board.members = board.members.filter(
      (m) => m.toString() !== user._id.toString()
    );

    await board.save();

    // Ghi activity
    await Activity.create({
      boardId: board._id,
      userId: req.user.id,
      action: "REMOVE_MEMBER",
      detail: `Removed member "${user.username}" from board "${board.title}"`
    });

    // 🔥 EMIT ACTIVITY UPDATE - Fetch all activities and emit
    if (req.io) {
      const activities = await Activity.find({ boardId: board._id })
        .populate("userId", "username")
        .sort({ createdAt: -1 })
        .limit(50);
      req.io.to(`board:${board._id}`).emit("activity:updated", { activity: activities });
    }

    // Tạo notification cho user bị removed
    await Notification.create({
      user: user._id,
      sender: req.user.id,
      boardId: board._id,
      type: "REMOVED_FROM_BOARD",
      message: `${req.user.username || "Someone"} removed you from board "${board.title}".`
    });

    // 🔥 REALTIME: Emit socket event
    if (req.io) {
      req.io.to(`board:${board._id}`).emit("member:removed", {
        boardId: board._id,
        userId: user._id,
        removedBy: req.user.id
      });
    }

    res.json({ message: "Member removed successfully" });

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

// Invite member to board by email
exports.inviteMember = async (req, res) => {
  try {
    const { email } = req.body;
    const boardId = req.params.id; // Get from URL parameter
    const { sendInviteEmail } = require("../utils/emailService");
    const crypto = require("crypto");

    const board = await Board.findById(boardId).populate("owner", "username");
    if (!board)
      return res.status(404).json({ message: "Board not found" });

    const isMember = board.members.some(
      m => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );
    if (!isMember)
      return res.status(403).json({ message: "Not allowed" });

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // User doesn't exist, create with random password
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const bcrypt = require("bcrypt");
      user = await User.create({
        username: email.split("@")[0] + "_" + Math.random().toString(36).substring(7),
        email,
        password: bcrypt.hashSync(randomPassword, 10)
      });
    }

    // Check if already a member
    if (board.members.some(m => (m._id ? m._id.toString() : m.toString()) === user._id.toString())) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await InviteToken.create({
      email,
      boardId,
      token: inviteToken,
      expiresAt
    });

    // Generate invite link
    const inviteLink = `${process.env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    
    // Try to send email (non-blocking - don't wait)
    // Use Brevo API if key is available
    if (process.env.BREVO_API_KEY) {
      sendInviteEmail(email, board.title, inviteLink, board.owner.username)
        .then((ok) => {
          if (ok) console.log("✅ Invite email sent to:", email);
          else console.error("⚠️ Invite email NOT sent (Brevo returned false)", email);
        })
        .catch(err => console.error("❌ Invite email error:", err.message));
    } else {
      console.warn("⚠️ BREVO_API_KEY missing — invite email not attempted");
    }

    res.json({ message: "Invite sent to " + email });

  } catch (err) {
    console.error("INVITE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Accept invite - adds user to board
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;

    const inviteToken = await InviteToken.findOne({
      token,
      expiresAt: { $gt: new Date() },
      acceptedAt: null
    }).populate("boardId");

    if (!inviteToken)
      return res.status(400).json({ message: "Invalid or expired invite token" });

    const board = inviteToken.boardId;
    
    // Get the logged-in user (from token)
    const loggedInUser = await User.findById(req.user.id);
    if (!loggedInUser)
      return res.status(401).json({ message: "Not authenticated" });
    
    // Check if logged-in user email matches the invited email
    if (loggedInUser.email !== inviteToken.email) {
      return res.status(403).json({ 
        message: `This invite is for ${inviteToken.email}. Please login with that account.` 
      });
    }
    
    let user = loggedInUser;

    // Add user to board (check if already exists first)
    const userIdString = user._id.toString();
    const isAlreadyMember = board.members.some(m => m.toString() === userIdString);
    
    if (!isAlreadyMember) {
      board.members.push(user._id);
      await board.save();
    }

    // Mark invite as accepted
    inviteToken.acceptedAt = new Date();
    await inviteToken.save();

    // Create notification
    await Notification.create({
      user: user._id,
      type: "ADD_TO_BOARD",
      message: `You were added to board "${board.title}"`,
      boardId: board._id
    });

    res.json({ message: "Successfully joined board", board });

  } catch (err) {
    console.error("ACCEPT INVITE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
