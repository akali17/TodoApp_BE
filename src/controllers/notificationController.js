const Notification = require("../models/Notification");

// GET list notifications for current user (paginated basic)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    if (notif.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    notif.isRead = true;
    await notif.save();

    res.json({ message: "Marked as read", notif });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ message: "Notification not found" });
    if (notif.user.toString() !== req.user.id) return res.status(403).json({ message: "Not allowed" });

    await notif.deleteOne();
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
