require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

const startDeadlineCron = require("./utils/checkdeadline");
const app = require("./app");
const connectDB = require("./config/db");
const socketHandler = require("./socket");

connectDB();
startDeadlineCron();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // FE Vite
    credentials: true
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
