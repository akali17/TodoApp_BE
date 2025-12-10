const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { // recipient
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: { // who triggered (may be null for system)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      default: null,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "ADD_TO_BOARD",
        "REMOVED_FROM_BOARD",
        "ASSIGNED_TO_CARD",
        "REMOVED_FROM_CARD",
        "DEADLINE_SOON",
        "GENERIC"
      ],
      required: true,
    },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
