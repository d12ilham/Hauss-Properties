// middleware/verifyCronKey.js

export const verifyCronKey = (req, res, next) => {
  const key = req.query.key;

  console.log("key", key);
  if (!process.env.CRON_SECRET_KEY) {
    console.warn("Warning: CRON_SECRET_KEY not set in environment!");
  }

  if (key !== process.env.CRON_SECRET_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
