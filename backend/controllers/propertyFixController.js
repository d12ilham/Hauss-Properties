import { promises as fs } from "fs";
import path from "path";
import xml2js from "xml2js";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");
const UPLOADS_DIR = "/home/xmluploader/uploads";
const ARCHIVE_DIR = path.join(UPLOADS_DIR, "archive");
const RENTAL_DIR = path.join(UPLOADS_DIR, "rental");
const COMMERCIAL_DIR = path.join(UPLOADS_DIR, "commercial");

// Helper to check duplicates and archive them for a given directory
const archiveDuplicatesInFolder = async (folderPath, archivePath) => {
  try {
    const fileNames = await fs.readdir(folderPath);
    const xmlFiles = fileNames.filter(
      (name) => name.endsWith(".xml") && !name.startsWith(".")
    );

    const uniqueIdMap = new Map();

    for (const fileName of xmlFiles) {
      const filePath = path.join(folderPath, fileName);
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
        console.error(`❌ Failed to parse duplicate check for ${fileName}:`, err.message);
        continue;
      }
    }

    let archiveCount = 0;
    for (const fileName of xmlFiles) {
      const entry = Array.from(uniqueIdMap.values()).find(
        (e) => e.filename === fileName
      );
      if (!entry) {
        try {
          const src = path.join(folderPath, fileName);
          const dest = path.join(archivePath, fileName);
          await fs.rename(src, dest);
          console.log(`📦 Archived duplicate from ${folderPath}: ${fileName}`);
          archiveCount++;
        } catch (err) {
          console.error(`❌ Failed to archive duplicate ${fileName} from ${folderPath}:`, err.message);
        }
      }
    }
    return archiveCount;
  } catch (err) {
    console.error(`❌ Error archiving duplicates in ${folderPath}:`, err.message);
    return 0;
  }
};

export const fixPropertiesFromFTP = async (req, res) => {
  console.log("🔁 Checking local XML uploads...");

  try {
    // Ensure destination folders exist
    await Promise.all(
      [ARCHIVE_DIR, RENTAL_DIR, COMMERCIAL_DIR].map((dir) =>
        fs.mkdir(dir, { recursive: true })
      )
    );

    // Step 1: Read incoming files from uploads directory
    const fileList = await fs.readdir(UPLOADS_DIR);
    const xmlFiles = fileList.filter(
      (name) => name.endsWith(".xml") && !name.startsWith(".")
    );

    console.log(`🔍 Found ${xmlFiles.length} XML files in main uploads directory`);

    // Step 2: Separate rentals and commercial listings to their folders
    let movedCount = 0;
    for (const fileName of xmlFiles) {
      const filePath = path.join(UPLOADS_DIR, fileName);

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

        // If it's rental or commercial → move to its dedicated directory
        if (typeKey === "rental" || typeKey === "commercial") {
          const destPath = path.join(
            typeKey === "rental" ? RENTAL_DIR : COMMERCIAL_DIR,
            fileName
          );
          await fs.rename(filePath, destPath);
          console.log(`📁 Moved ${typeKey} listing: ${fileName}`);
          movedCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to process category move for ${fileName}:`, err.message);
      }
    }

    // Step 3: Archive older duplicates in each directory separately
    const archivedResidential = await archiveDuplicatesInFolder(UPLOADS_DIR, ARCHIVE_DIR);
    const archivedRental = await archiveDuplicatesInFolder(RENTAL_DIR, ARCHIVE_DIR);
    const archivedCommercial = await archiveDuplicatesInFolder(COMMERCIAL_DIR, ARCHIVE_DIR);

    const totalArchived = archivedResidential + archivedRental + archivedCommercial;

    return res.status(200).json({
      status: "success",
      message: `Processed files. Moved ${movedCount} to folders. Archived ${totalArchived} duplicates (Residential: ${archivedResidential}, Rental: ${archivedRental}, Commercial: ${archivedCommercial}).`,
    });
  } catch (err) {
    console.error("🚨 Error in fixPropertiesFromFTP:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  }
};
