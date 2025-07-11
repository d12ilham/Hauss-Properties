import pool from "../db/connection.js";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { verifyToken } from "../utils/auth.js";

// Register new admin
export const register = async (req, res) => {
  const { email, password, adminKey } = req.body;

  console.log("adminKey", adminKey);

  try {
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(400).json({ message: "Admin key is incorrect" });
    }
    // Check if admin exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create admin
    const [result] = await pool.query(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hashedPassword]
    );

    // Generate token
    const token = generateToken(result.insertId);

    res.status(201).json({
      status: "success",
      token,
      user: {
        id: result.insertId,
        email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
// Login admin
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if admin exists
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    // Check password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user.id);

    res.status(200).json({
      status: "success",
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Protect middleware (for protected routes)
export const protect = async (req, res, next) => {
  let token;

  // Get token from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Get admin from database
    const [users] = await pool.query("SELECT * FROM users WHERE id = ?", [
      decoded.id,
    ]);

    if (users.length === 0) {
      return res.status(401).json({ message: "Admin no longer exists" });
    }

    req.user = users[0];
    next();
  } catch (err) {
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};
