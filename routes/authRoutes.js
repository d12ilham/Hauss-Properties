import express from "express";
import { register, login, protect } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Protected admin route
router.get("/dashboard", protect, (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
      },
    },
  });
});

export default router;
