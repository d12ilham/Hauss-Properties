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
    qr_url TEXT,
    listing_agent VARCHAR(255),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_property_id (property_id)
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
  } catch (err) {
    console.error("Database initialization failed:", err);
    throw err;
  }
}

export default initializeDatabase;
