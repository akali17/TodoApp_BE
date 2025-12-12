require("dotenv").config()
const startDeadlineCron = require("./utils/checkdeadline");
const app = require("./app")
const connectDB = require("./config/db")

connectDB()
startDeadlineCron();

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log("Server running on " + PORT))
