const userRoutes = require("./routes/userRoutes");
const express = require("express")
const cors = require("cors")
const routes = require("./routes");
const app = express()
const boardRoutes = require("./routes/boardRoutes");

app.use(cors())
app.use(express.json())
app.use("/api", routes);
app.use("/api/users", userRoutes);
app.use("/api/boards", boardRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Backend running!!" })
})

module.exports = app
