const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const boardRoutes = require("./routes/boardRoutes");
const columnRoutes = require("./routes/columnRoutes");
const cardRoutes = require("./routes/cardRoutes");
const notifRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// 🔥 MIDDLEWARE: Gắn io vào request
app.use((req, res, next) => {
  req.io = app.get("io");
  if (!req.io) {
    console.warn("⚠️ WARNING: req.io is undefined!");
  }
  next();
});

// ⚠️ routes
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/notifications", notifRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Backend running!!" });
});

module.exports = app;
