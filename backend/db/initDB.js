// db/initDB.js
import pool from "./connection.js";

async function runQuery(query, params = []) {
  try {
    const [result] = await pool.query(query, params);
    return result;
  } catch (err) {
    console.error("Query failed:", { query, error: err.message });
    throw err;
  }
}

async function initializeDatabase() {
  const tables = [
    {
      name: "users",
      schema: `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `,
    },
    {
      name: "properties",
      schema: `
    CREATE TABLE properties (
      id INT AUTO_INCREMENT PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL UNIQUE,
    property_name TEXT NOT NULL,
    description TEXT,
    lifestyle_assets JSON,
    active BOOLEAN DEFAULT TRUE,
    property_type VARCHAR(100),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'current',
    video_link TEXT,
    price_view VARCHAR(255),
    auction BOOLEAN DEFAULT NULL,
    auction_date TEXT,
    external_link TEXT,
    qr_url TEXT,
    listing_agent VARCHAR(255),
    contact_agent VARCHAR(255),
    agents JSON,
    sub_number VARCHAR(50),
    street_number VARCHAR(50),
    street VARCHAR(255),
    suburb VARCHAR(255),
    state VARCHAR(100),
    postcode VARCHAR(20),
    country VARCHAR(100),
    land_area FLOAT,
    land_area_unit VARCHAR(20),
    inspection_times JSON,
    features JSON,
    eco_friendly JSON,
    gallery JSON,
    property_documents JSON,
    slug VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mod_time DATETIME,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_property_id (property_id),
      INDEX idx_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
    },
  ];

  try {
    for (const table of tables) {
      const tableExists = await runQuery(
        `SELECT 1 FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ? LIMIT 1`,
        [process.env.DB_NAME, table.name]
      );

      if (tableExists.length === 0) {
        await runQuery(table.schema);
        console.log(`Created ${table.name} table`);
      }
    }

    // Auto-migration: Check if 'agents' column exists in existing 'properties' table
    const agentsColCheck = await runQuery(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'agents' LIMIT 1`,
      [process.env.DB_NAME]
    );

    if (agentsColCheck.length === 0) {
      await runQuery(`ALTER TABLE properties ADD COLUMN agents JSON AFTER contact_agent`);
      console.log("✅ Auto-migration: Added 'agents' JSON column to properties table");
    }

    // Auto-migration: Check if 'price_view' column exists in existing 'properties' table
    const priceViewColCheck = await runQuery(
      `SELECT 1 FROM information_schema.columns 
       WHERE table_schema = ? AND table_name = 'properties' AND column_name = 'price_view' LIMIT 1`,
      [process.env.DB_NAME]
    );

    if (priceViewColCheck.length === 0) {
      await runQuery(`ALTER TABLE properties ADD COLUMN price_view VARCHAR(255) AFTER video_link`);
      console.log("✅ Auto-migration: Added 'price_view' column to properties table");
    }
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}

export default initializeDatabase;
