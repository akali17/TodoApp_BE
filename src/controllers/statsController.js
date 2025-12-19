const Board = require("../models/Board");
const Card = require("../models/Card");
const Column = require("../models/Column");

// Get board statistics
exports.getBoardStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get all boards for the user (owner or member)
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select("_id title owner members");

    // Get statistics for each board
    const stats = await Promise.all(
      boards.map(async (board) => {
        // Get only cards assigned to the current user
        const cards = await Card.find({ 
          board: board._id,
          members: userId
        });
        
        // Get all columns for this board
        const columns = await Column.find({ board: board._id });

        // Count cards by column (status)
        const cardsByColumn = {};
        let totalCards = cards.length;

        for (const column of columns) {
          const cardsInColumn = cards.filter(
            (c) => c.column.toString() === column._id.toString()
          );
          const completedInColumn = cardsInColumn.filter((c) => c.isDone === true).length;
          cardsByColumn[column.title] = {
            total: cardsInColumn.length,
            completed: completedInColumn,
            notCompleted: cardsInColumn.length - completedInColumn
          };
        }

        // Count completed cards by checking isDone flag
        const completedCards = cards.filter((card) => card.isDone === true).length;

        const completionRate =
          totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

        // Get unique members (owner + members, avoiding duplicates)
        const uniqueMembers = new Set([
          board.owner.toString(),
          ...board.members.map((m) => m.toString()),
        ]);

        return {
          boardId: board._id,
          boardTitle: board.title,
          totalCards,
          completedCards,
          completionRate,
          cardsByColumn,
          columnCount: columns.length,
          memberCount: uniqueMembers.size,
        };
      })
    );

    // Overall statistics
    const boardIds = boards.map((b) => b._id);
    const allCards = await Card.find({ 
      board: { $in: boardIds },
      members: userId
    });
    const totalBoards = boards.length;
    const totalCards = allCards.length;
    const totalCompleted = stats.reduce((sum, s) => sum + s.completedCards, 0);
    const overallCompletionRate =
      totalCards > 0 ? Math.round((totalCompleted / totalCards) * 100) : 0;

    res.json({
      overall: {
        totalBoards,
        totalCards,
        totalCompleted,
        overallCompletionRate,
      },
      boards: stats,
    });
  } catch (err) {
    console.error("GET BOARD STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const Activity = require("../models/Activity");

    // Get activity for the past 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activities = await Activity.find({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Group by day
    const activityByDay = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activityByDay[dateStr] = 0;
    }

    activities.forEach((activity) => {
      const dateStr = activity.createdAt.toISOString().split("T")[0];
      if (activityByDay[dateStr] !== undefined) {
        activityByDay[dateStr]++;
      }
    });

    res.json({
      activityByDay: Object.entries(activityByDay).map(([date, count]) => ({
        date,
        count,
      })),
    });
  } catch (err) {
    console.error("GET ACTIVITY STATS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all cards with deadlines
exports.getCardsWithDeadlines = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get all boards for the user (owner or member)
    const boards = await Board.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select("_id title");

    // Get all cards with deadlines for these boards that are assigned to the current user
    const boardIds = boards.map((b) => b._id);
    const cards = await Card.find({
      board: { $in: boardIds },
      deadline: { $exists: true, $ne: null },
      members: userId
    }).populate("board", "title");

    const cardsWithDeadlines = cards.map((card) => ({
      id: card._id,
      title: card.title,
      deadline: card.deadline,
      isCompleted: card.isDone,
      isNotStarted: !card.isDone,
      boardTitle: card.board?.title,
      boardId: card.board?._id,
    }));

    res.json(cardsWithDeadlines);
  } catch (err) {
    console.error("GET CARDS WITH DEADLINES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
