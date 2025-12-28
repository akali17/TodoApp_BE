const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  action: {
    type: String,
    required: true, 
    enum: [
      "CREATE_COLUMN", "UPDATE_COLUMN", "DELETE_COLUMN",
      "CREATE_CARD", "UPDATE_CARD", "DELETE_CARD",
      "ADD_MEMBER", "REMOVE_MEMBER", "LEAVE_BOARD", "UPDATE_BOARD","MOVE_CARD"
    ]
  },
  detail: {
    type: String, // mô tả hiển thị cho FE
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Activity", activitySchema);
