import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    let decoded;
    const token = authHeader.split(" ")[1];

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      const message =
        error.name === "TokenExpiredError"
          ? "Token has expired. Please log in again."
          : "Invalid token. Please log in again.";

      return res.status(401).json({ success: false, message });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication.",
    });
  }
};

export default protect;
