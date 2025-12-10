const express = require("express")
const cors = require("cors")
const routes = require("./routes");
const app = express()
const userRoutes = require("./routes/userRoutes");
const boardRoutes = require("./routes/boardRoutes");
const columnRoutes = require("./routes/columnRoutes");
const cardRoutes = require("./routes/cardRoutes");
const notifRoutes = require("./routes/notificationRoutes");

app.use(cors())
app.use(express.json())
app.use("/api", routes);
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/notifications", notifRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Backend running!!" })
})

module.exports = app
