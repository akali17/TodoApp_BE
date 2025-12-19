require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const startDeadlineCron = require("./utils/checkDeadline");
const app = require("./app");
const connectDB = require("./config/db");
const socketHandler = require("./socket");

connectDB();
startDeadlineCron();

const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// 🔥 GẮN IO VÀO APP (QUAN TRỌNG)
app.set("io", io);

// socket handler - truyền io vào thay vì tạo mới
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);
