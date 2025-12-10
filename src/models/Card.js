const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },             // Tên card
    description: { type: String, default: "" },          // Mô tả công việc
    deadline: { type: Date, default: null },             // Hạn chót
    isDone: { type: Boolean, default: false },           // Đã hoàn thành chưa

    board: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    column: { type: mongoose.Schema.Types.ObjectId, ref: "Column", required: true },

    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" } // Người thực hiện
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    order: { type: Number, default: 0 },                 // Thứ tự trong column
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
