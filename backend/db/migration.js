import pool from "./connection.js";

async function migrate() {
  try {
    // 1. Add status column if it doesn't exist
    const [colsStatus] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'status'`,
      [process.env.DB_NAME]
    );
    if (colsStatus.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN status VARCHAR(50) DEFAULT 'current'");
      console.log("Added 'status' column to properties table.");
    }

    // 2. Add video_link column if it doesn't exist
    const [colsVideo] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'video_link'`,
      [process.env.DB_NAME]
    );
    if (colsVideo.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN video_link TEXT");
      console.log("Added 'video_link' column to properties table.");
    }

    // 3. Add auction column if it doesn't exist
    const [colsAuction] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'auction'`,
      [process.env.DB_NAME]
    );
    if (colsAuction.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN auction BOOLEAN DEFAULT NULL");
      console.log("Added 'auction' column to properties table.");
    }

    // 4. Add auction_date column if it doesn't exist
    const [colsAuctionDate] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'auction_date'`,
      [process.env.DB_NAME]
    );
    if (colsAuctionDate.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN auction_date TEXT DEFAULT NULL");
      console.log("Added 'auction_date' column to properties table.");
    }

    // 5. Add external_link column if it doesn't exist
    const [colsExt] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'external_link'`,
      [process.env.DB_NAME]
    );
    if (colsExt.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN external_link TEXT DEFAULT NULL");
      console.log("Added 'external_link' column to properties table.");
    }

    // 6. Set existing NULL property_type to 'residential'
    const [resultType] = await pool.query("UPDATE properties SET property_type = 'residential' WHERE property_type IS NULL");
    console.log(`Updated ${resultType.affectedRows} properties to 'residential' property_type.`);

    // 7. Set existing NULL status to 'current'
    const [resultStatus] = await pool.query("UPDATE properties SET status = 'current' WHERE status IS NULL");
    console.log(`Updated ${resultStatus.affectedRows} properties to 'current' status.`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
