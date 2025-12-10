const express = require("express");
const { register, login } = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  res.json({ message: "Authorized", userId: req.user.id });
});

router.post("/register", register);
router.post("/login", login);

module.exports = router;
