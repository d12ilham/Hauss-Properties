import ftp from "basic-ftp";
import { promises as fs } from "fs";
import path from "path";
import xml2js from "xml2js";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");

export const fixPropertiesFromFTP = async (req, res) => {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  console.log("🔁 Checking for duplicates on FTP...");
  try {
    // Step 1: Connect to FTP
    await ftpClient.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: true,
      secureOptions: {
        rejectUnauthorized: false,
      },
    });
    console.log("✅ FTP connected securely");

    // Step 2: List all XML files in root
    const fileList = await ftpClient.list();
    const xmlFiles = fileList.filter(
      (f) => f.name.endsWith(".xml") && !f.name.startsWith(".")
    );

    console.log(`🔍 Found ${xmlFiles.length} XML files`);

    if (xmlFiles.length === 0) {
      return res.status(200).json({
        status: "success",
        message: "No XML files found.",
      });
    }

    // Step 3: Make sure /archive exists
    try {
      await ftpClient.cd("/archive");
      await ftpClient.cd(".."); // go back to root
    } catch {
      await ftpClient.ensureDir("/archive");
    }

    const uniqueIdMap = new Map(); // uniqueID → { filename, modTime }

    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Step 4: First pass - parse each file to extract uniqueID and modTime
    for (const file of xmlFiles) {
      const localPath = path.join(TEMP_DIR, file.name);
      try {
        await ftpClient.downloadTo(localPath, file.name);

        const xmlData = await fs.readFile(localPath, "utf8");
        const result = await xml2js.parseStringPromise(xmlData, {
          explicitArray: false,
          mergeAttrs: true,
        });

        const propertyTypes = ["residential", "rental", "commercial"];
        let property = null;

        for (const type of propertyTypes) {
          if (result.propertyList?.[type]) {
            property = result.propertyList[type];
            break;
          }
        }

        if (!property || !property.uniqueID) {
          await fs.unlink(localPath);
          continue;
        }

        const uniqueID = property.uniqueID;
        const propNode = result.propertyList.$; // contains attributes like modTime
        const xmlModTime = propNode?.modTime
          ? new Date(propNode.modTime)
          : new Date(file.modifiedAt);

        const existing = uniqueIdMap.get(uniqueID);

        if (!existing || xmlModTime > new Date(existing.modTime)) {
          uniqueIdMap.set(uniqueID, {
            filename: file.name,
            modTime: xmlModTime,
          });
        }

        await fs.unlink(localPath); // cleanup immediately
      } catch (err) {
        console.error(`❌ Failed to process ${file.name}:`, err.message);
        continue;
      }
    }

    console.log(
      `🗂️ Identified latest files for ${uniqueIdMap.size} unique IDs`
    );

    // Step 5: Second pass - move non-latest files to archive
    let movedCount = 0;

    for (const file of xmlFiles) {
      const localPath = path.join(TEMP_DIR, file.name);
      try {
        await ftpClient.downloadTo(localPath, file.name);

        const xmlData = await fs.readFile(localPath, "utf8");
        const result = await xml2js.parseStringPromise(xmlData, {
          explicitArray: false,
          mergeAttrs: true,
        });

        let property = null;
        const propertyTypes = ["residential", "rental", "commercial"];

        for (const type of propertyTypes) {
          if (result.propertyList?.[type]) {
            property = result.propertyList[type];
            break;
          }
        }

        if (!property || !property.uniqueID) {
          await fs.unlink(localPath);
          continue;
        }

        const uniqueID = property.uniqueID;
        const latestFile = uniqueIdMap.get(uniqueID)?.filename;

        if (latestFile && latestFile !== file.name) {
          try {
            // ✅ Use rename() instead of move()
            await ftpClient.rename(file.name, `archive/${file.name}`);
            console.log(`✅ Moved to archive: ${file.name}`);
            movedCount++;
          } catch (moveErr) {
            console.error(`❌ Failed to move ${file.name}:`, moveErr.message);
          }
        }

        await fs.unlink(localPath);
      } catch (err) {
        console.error(`❌ Error downloading ${file.name}:`, err.message);
        continue;
      }
    }

    console.log(`🎉 Done. Moved ${movedCount} duplicate files to archive.`);

    return res.status(200).json({
      status: "success",
      message: `Moved ${movedCount} duplicate files to archive.`,
    });
  } catch (err) {
    console.error("🚨 Error in fixPropertiesFromFTP:", err.message);
    return res.status(500).json({ status: "error", message: err.message });
  } finally {
    await ftpClient.close();
  }
};
