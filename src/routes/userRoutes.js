const express = require("express");
const { register, login, logout } = require("../controllers/userController");
const auth = require("../middlewares/authMiddleware");
const { googleLogin } = require("../controllers/userController");
const router = express.Router();

router.get("/me", auth, async (req, res) => {
  res.json({ message: "Authorized", userId: req.user.id });
});

router.post("/register", register);
router.post("/login", login);
router.post("/logout", auth, logout);

router.post("/google-login", googleLogin)
module.exports = router;
