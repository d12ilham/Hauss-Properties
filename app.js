import express from "express";
import cors from "cors";
import initializeDatabase from "./db/initDB.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";

async function startServer() {
  const app = express();

  // Enable CORS
  app.use(
    cors({
      origin: process.env.FONTEND_URL,
      credentials: true,
    })
  );

  // Initialize database
  await initializeDatabase();

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  app.use(cookieParser());

  // Routes
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/properties", propertyRoutes);

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
