const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware"); // your auth
const notifCtrl = require("../controllers/notificationController");

router.get("/", auth, notifCtrl.getNotifications);
router.patch("/:id/read", auth, notifCtrl.markAsRead);
router.delete("/:id", auth, notifCtrl.deleteNotification);

module.exports = router;
