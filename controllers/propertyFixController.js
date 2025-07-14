import ftp from "basic-ftp";
import { promises as fs } from "fs";
import path from "path";
import xml2js from "xml2js";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");

export const fixPropertiesFromFTP = async (req, res) => {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  console.log("🔁 Checking FTP...");

  try {
    await ftpClient.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: true,
      secureOptions: { rejectUnauthorized: false },
    });
    console.log("✅ FTP connected");

    const fileList = await ftpClient.list();
    const xmlFiles = fileList.filter(
      (f) => f.name.endsWith(".xml") && !f.name.startsWith(".")
    );
    console.log(`🔍 Found ${xmlFiles.length} XML files`);

    if (xmlFiles.length === 0) {
      return res
        .status(200)
        .json({ status: "success", message: "No XML files found." });
    }

    // Ensure folders exist
    const folders = ["/archive", "/rental", "/commercial"];
    for (const folder of folders) {
      await ftpClient.ensureDir(folder);
      await ftpClient.cd("/"); // back to root
    }

    const uniqueIdMap = new Map();
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Step 1: Collect only residential files for duplicate check
    for (const file of xmlFiles) {
      const localPath = path.join(TEMP_DIR, file.name);
      try {
        await ftpClient.downloadTo(localPath, file.name);
        const xmlData = await fs.readFile(localPath, "utf8");
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
          await ftpClient.rename(file.name, `${typeKey}/${file.name}`);
          console.log(`📁 Moved ${typeKey} to /${typeKey}/: ${file.name}`);
          await fs.unlink(localPath);
          continue;
        }

        // Only proceed if residential
        const property = propertyList[typeKey];
        if (!property || !property.uniqueID) {
          await fs.unlink(localPath);
          continue;
        }

        const uniqueID = property.uniqueID;
        const modTime =
          propertyList?.modTime || propertyList?.$?.modTime || file.modifiedAt;
        const xmlModTime = new Date(modTime);

        const existing = uniqueIdMap.get(uniqueID);
        if (!existing || xmlModTime > new Date(existing.modTime)) {
          uniqueIdMap.set(uniqueID, {
            filename: file.name,
            modTime: xmlModTime,
          });
        }

        await fs.unlink(localPath);
      } catch (err) {
        console.error(`❌ Failed to process ${file.name}:`, err.message);
        continue;
      }
    }

    // Step 2: Archive older duplicates (only residential ones)
    let archiveCount = 0;
    for (const file of xmlFiles) {
      const entry = Array.from(uniqueIdMap.values()).find(
        (e) => e.filename === file.name
      );
      if (!entry) {
        try {
          await ftpClient.rename(file.name, `archive/${file.name}`);
          console.log(`📦 Archived residential duplicate: ${file.name}`);
          archiveCount++;
        } catch (err) {
          console.error(
            `❌ Failed to move ${file.name} to archive:`,
            err.message
          );
        }
      }
    }

    return res.status(200).json({
      status: "success",
      message: `Processed ${xmlFiles.length} files. Moved ${archiveCount} duplicate residential files to archive. Rental/Commercial sent to their folders.`,
    });
  } catch (err) {
    console.error("🚨 Error in fixPropertiesFromFTP:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  } finally {
    await ftpClient.close();
  }
};
