const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Không có token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Lấy token
    const token = authHeader.split(" ")[1];

    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu ID user vào request để các route sau truy cập
    req.user = { id: decoded.id };

    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
