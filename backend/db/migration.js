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

    // Add category column if it doesn't exist
    const [colsCategory] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'category'`,
      [process.env.DB_NAME]
    );
    if (colsCategory.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN category VARCHAR(100) DEFAULT NULL");
      console.log("Added 'category' column to properties table.");
    }

    // 6. Set existing NULL property_type to 'residential'
    const [resultType] = await pool.query("UPDATE properties SET property_type = 'residential' WHERE property_type IS NULL");
    console.log(`Updated ${resultType.affectedRows} properties to 'residential' property_type.`);

    // 8. Add slug column if it doesn't exist
    const [colsSlug] = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'slug'`,
      [process.env.DB_NAME]
    );
    if (colsSlug.length === 0) {
      await pool.query("ALTER TABLE properties ADD COLUMN slug VARCHAR(255) DEFAULT NULL, ADD INDEX idx_slug (slug)");
      console.log("Added 'slug' column and index to properties table.");
    }

    // 9. Backfill slugs for existing properties
    const [existingRows] = await pool.query(
      "SELECT id, property_id, sub_number, street_number, street, suburb, state, postcode FROM properties WHERE slug IS NULL OR slug = ''"
    );
    let updatedSlugs = 0;
    for (const p of existingRows) {
      const parts = [p.sub_number, p.street_number, p.street, p.suburb, p.state, p.postcode].filter(Boolean);
      const generated = parts.join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const finalSlug = generated || p.property_id;
      await pool.query("UPDATE properties SET slug = ? WHERE id = ?", [finalSlug, p.id]);
      updatedSlugs++;
    }
    console.log(`Backfilled slugs for ${updatedSlugs} properties.`);

  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
