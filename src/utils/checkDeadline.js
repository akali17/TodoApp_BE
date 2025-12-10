const cron = require("node-cron");
const Card = require("../models/Card");
const Notification = require("../models/Notification");
const Board = require("../models/Board");

// chạy mỗi giờ
function startDeadlineCron() {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // tìm các card có deadline trong khoảng giờ tới 24h, chưa done
      const cards = await Card.find({
        deadline: { $gte: now, $lte: next24h },
        isDone: { $ne: true }
      }).populate("members").populate("board");

      for (const card of cards) {
        // check đã có notification DEADLINE_SOON cho card (tránh spam)
        const exists = await Notification.findOne({
          cardId: card._id,
          type: "DEADLINE_SOON"
        });

        if (exists) continue;

        // tạo notification cho từng member (và owner/admin nếu muốn)
        const recipients = card.members.length ? card.members : [];

        for (const member of recipients) {
          await Notification.create({
            user: member._id,
            sender: null, // hệ thống
            boardId: card.board ? card.board._id : null,
            cardId: card._id,
            type: "DEADLINE_SOON",
            message: `Card "${card.title}" is due at ${card.deadline.toLocaleString()}.`
          });
        }

        // Optionally: notify board owner too
        if (card.board && card.board.owner) {
          await Notification.create({
            user: card.board.owner,
            sender: null,
            boardId: card.board._id,
            cardId: card._id,
            type: "DEADLINE_SOON",
            message: `Card "${card.title}" assigned to members is due at ${card.deadline.toLocaleString()}.`
          });
        }
      }
    } catch (err) {
      console.error("Deadline cron error:", err);
    }
  });
}

module.exports = startDeadlineCron;
