// middleware/verifyCronKey.js
const CRON_SECRET_KEY = process.env.CRON_SECRET_KEY || "yoursecret";

export function verifyCronKey(req, res, next) {
  const key = req.query.key;
  if (key !== CRON_SECRET_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}
