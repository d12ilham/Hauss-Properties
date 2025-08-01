import { promises as fs } from "fs";
import path from "path";
import xml2js from "xml2js";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");
const UPLOADS_DIR = "/home/xmluploader/uploads";
const ARCHIVE_DIR = path.join(UPLOADS_DIR, "archive");
const RENTAL_DIR = path.join(UPLOADS_DIR, "rental");
const COMMERCIAL_DIR = path.join(UPLOADS_DIR, "commercial");

export const fixPropertiesFromFTP = async (req, res) => {
  console.log("🔁 Checking local XML uploads...");

  try {
    // Read files from uploads directory
    const fileList = await fs.readdir(UPLOADS_DIR);
    const xmlFiles = fileList.filter(
      (name) => name.endsWith(".xml") && !name.startsWith(".")
    );

    console.log(`🔍 Found ${xmlFiles.length} XML files`);

    if (xmlFiles.length === 0) {
      return res
        .status(200)
        .json({ status: "success", message: "No XML files found." });
    }

    // Ensure destination folders exist
    await Promise.all(
      [ARCHIVE_DIR, RENTAL_DIR, COMMERCIAL_DIR].map((dir) =>
        fs.mkdir(dir, { recursive: true })
      )
    );

    const uniqueIdMap = new Map();
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Step 1: Collect only residential files for duplicate check
    for (const fileName of xmlFiles) {
      const filePath = path.join(UPLOADS_DIR, fileName);
      const localPath = path.join(TEMP_DIR, fileName);

      try {
        const xmlData = await fs.readFile(filePath, "utf8");
        const result = await xml2js.parseStringPromise(xmlData, {
          explicitArray: false,
          mergeAttrs: true,
        });

        const propertyList = result.propertyList || {};
        const keys = Object.keys(propertyList).filter((k) => k !== "$");
        const typeKey = keys.find((k) =>
          ["residential", "rental", "commercial"].includes(k)
        );

        if (!typeKey) continue;

        // If it's rental or commercial → move immediately
        if (typeKey === "rental" || typeKey === "commercial") {
          const destPath = path.join(
            typeKey === "rental" ? RENTAL_DIR : COMMERCIAL_DIR,
            fileName
          );
          await fs.rename(filePath, destPath);
          console.log(`📁 Moved ${fileName} to ${typeKey}/`);
          continue;
        }

        // Only proceed if residential
        const property = propertyList[typeKey];
        if (!property || !property.uniqueID) continue;

        const uniqueID = property.uniqueID;
        const modTime = propertyList?.modTime || propertyList?.$?.modTime;
        const stat = await fs.stat(filePath);
        const xmlModTime = new Date(modTime || stat.mtime);

        const existing = uniqueIdMap.get(uniqueID);
        if (!existing || xmlModTime > new Date(existing.modTime)) {
          uniqueIdMap.set(uniqueID, {
            filename: fileName,
            modTime: xmlModTime,
          });
        }
      } catch (err) {
        console.error(`❌ Failed to process ${fileName}:`, err.message);
        continue;
      }
    }

    // Step 2: Archive older duplicates (residential)
    let archiveCount = 0;
    for (const fileName of xmlFiles) {
      const entry = Array.from(uniqueIdMap.values()).find(
        (e) => e.filename === fileName
      );
      if (!entry) {
        try {
          const src = path.join(UPLOADS_DIR, fileName);
          const dest = path.join(ARCHIVE_DIR, fileName);
          await fs.rename(src, dest);
          console.log(`📦 Archived residential duplicate: ${fileName}`);
          archiveCount++;
        } catch (err) {
          console.error(`❌ Failed to archive ${fileName}:`, err.message);
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: `Processed ${xmlFiles.length} files. Archived ${archiveCount} residential duplicates. Rental/Commercial moved.`,
    });
  } catch (err) {
    console.error("🚨 Error in fixPropertiesFromLocal:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
