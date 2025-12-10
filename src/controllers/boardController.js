const Board = require("../models/Board");

// Tạo board
exports.createBoard = async (req, res) => {
  try {
    const { title, description } = req.body;

    const board = await Board.create({
      title,
      description,
      owner: req.user.id,
      members: [req.user.id], // owner tự vào board
    });
    

    res.status(201).json({ message: "Board created", board });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Lấy tất cả board user tham gia
exports.getMyBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      members: req.userId,
    });

    res.json({ boards });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Chi tiết 1 board
exports.getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board)
      return res.status(404).json({ message: "Board not found" });

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
