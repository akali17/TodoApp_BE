const jwt = require("jsonwebtoken");

let onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
  // Helper to emit to a specific online user by userId
  io.emitToUser = (userId, event, payload) => {
    try {
      const sid = onlineUsers.get(String(userId));
      if (sid) io.to(sid).emit(event, payload);
    } catch (e) {
      // silent
    }
  };

  io.on("connection", (socket) => {
    // ================= AUTH (từ handshake) =================
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        socket.userId = userId; // Lưu userId vào socket object
        onlineUsers.set(String(userId), socket.id);

        io.emit("online-users", Array.from(onlineUsers.keys()));
      }
    } catch (err) {
      // Socket auth error
    }

    // ================= JOIN BOARD =================
    socket.on("join-board", (boardId) => {
      socket.join(`board:${boardId}`);
      
      // Emit online users to all users globally (including the joining user)
      io.emit("online-users", Array.from(onlineUsers.keys()));
      
      // Announce user joined to board room
      io.to(`board:${boardId}`).emit("user:joined", {
        userId: socket.userId,
        onlineUsers: Array.from(onlineUsers.keys())
      });
    });

    socket.on("leave-board", (boardId) => {
      socket.leave(`board:${boardId}`);
      // Announce user left
      io.to(`board:${boardId}`).emit("user:left", {
        userId: socket.userId,
        onlineUsers: Array.from(onlineUsers.keys())
      });
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(String(socket.userId));
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};
