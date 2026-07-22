import pool from "../db/connection.js";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const DOCUMENTS_ROOT = path.join(process.cwd(), "documents");

async function ensureDir(dirPath) {
  return fs.promises.mkdir(dirPath, { recursive: true });
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.statusText}`);

  const fileStream = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", reject);
    fileStream.on("finish", resolve);
  });
}

export const downloadPropertyDocs = async function (req, res) {
  try {
    // Fetch all properties that have documents with https URLs
    const [properties] = await pool.query(
      "SELECT property_id, property_documents FROM properties WHERE JSON_LENGTH(property_documents) > 0"
    );

    for (const property of properties) {
      const { property_id, property_documents } = property;

      if (!property_documents) continue;

      // Parse JSON if needed
      let docs;
      if (typeof property_documents === "string") {
        try {
          docs = JSON.parse(property_documents);
        } catch {
          console.warn(`Invalid JSON for property_id ${property_id}`);
          continue;
        }
      } else {
        docs = property_documents;
      }

      // Filter docs with https URLs
      const httpsDocs = docs.filter(
        (doc) => typeof doc.url === "string" && doc.url.startsWith("https://")
      );
      if (httpsDocs.length === 0) continue;

      // Ensure property folder exists
      const propertyDir = path.join(DOCUMENTS_ROOT, String(property_id));
      await ensureDir(propertyDir);

      // Download and rename files: 1.pdf, 2.pdf, ...
      for (let i = 0; i < httpsDocs.length; i++) {
        const doc = httpsDocs[i];
        const ext = path.extname(new URL(doc.url).pathname) || ".pdf"; // fallback to .pdf
        const filename = `${i + 1}${ext}`;
        const filePath = path.join(propertyDir, filename);

        try {
          await downloadFile(doc.url, filePath);
          console.log(`Downloaded ${doc.url} to ${filePath}`);

          // Update local URL in docs object
          doc.url = `/documents/${property_id}/${filename}`;
        } catch (err) {
          console.error(`Error downloading ${doc.url}:`, err.message);
        }
      }

      // Update property_documents in DB with new URLs
      try {
        const updatedDocsJSON = JSON.stringify(docs);
        await pool.query(
          "UPDATE properties SET property_documents = ? WHERE property_id = ?",
          [updatedDocsJSON, property_id]
        );
        console.log(
          `Updated property_documents for property_id ${property_id}`
        );
      } catch (err) {
        console.error(
          `Failed to update DB for property_id ${property_id}:`,
          err.message
        );
      }
    }

    return res.status(200).json({
      status: "success",
      message: "Property documents downloaded and updated successfully",
    });
  } catch (error) {
    console.error("Fatal error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error during document download",
    });
  }
};
