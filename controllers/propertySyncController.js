import pool from "../db/connection.js";
import ftp from "basic-ftp";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import xml2js from "xml2js";

//sync data from ftp
const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");

export const syncPropertiesFromFTP = async (req, res) => {
  const ftpClient = new ftp.Client();
  ftpClient.ftp.verbose = false;

  console.log("🔁 Sync started...");
  try {
    // 1. Connect to FTP
    await ftpClient.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      secure: true,
      secureOptions: {
        rejectUnauthorized: false, // Accept mismatched certificate
      },
    });
    console.log("✅ FTP connected securely (hostname ignored)");

    // 2. List files in FTP root (or subfolder)
    const fileList = await ftpClient.list();

    // 2.1 Filter XML files only, skip .ftpquota and other hidden/system files
    const xmlFiles = fileList.filter(
      (file) => file.name.endsWith(".xml") && !file.name.startsWith(".")
    );

    // 3. Group files by uniqueID (extracted from filename or content) to find latest by mod time
    const propertyFilesMap = new Map();

    // First pass: Download files temporarily to extract uniqueID
    await fs.mkdir(TEMP_DIR, { recursive: true });

    for (const file of xmlFiles) {
      const localPath = path.join(TEMP_DIR, file.name);
      await ftpClient.downloadTo(localPath, file.name);

      // Read XML to get uniqueID
      const xmlData = await fs.readFile(localPath, "utf8");
      const result = await xml2js.parseStringPromise(xmlData, {
        explicitArray: false,
        mergeAttrs: true,
      });

      const property = result.propertyList?.residential;
      if (!property || !property.uniqueID) continue;

      const uniqueID = property.uniqueID;
      const existing = propertyFilesMap.get(uniqueID);

      if (
        !existing ||
        new Date(file.modifiedAt) > new Date(existing.file.modifiedAt)
      ) {
        propertyFilesMap.set(uniqueID, {
          file,
          localPath,
          propertyData: property,
        });
      }
    }

    const properties = [];

    // Process only the latest version of each property
    for (const [
      uniqueID,
      { file, localPath, propertyData },
    ] of propertyFilesMap) {
      const property = propertyData;

      // Basic fields
      const headline = property.headline;
      const description = property.description;
      let listingAgentName = null;
      if (property.listingAgent) {
        if (Array.isArray(property.listingAgent)) {
          const agentWithName = property.listingAgent.find(
            (agent) => agent.name
          );
          listingAgentName = agentWithName ? agentWithName.name : null;
        } else if (property.listingAgent.name) {
          listingAgentName = property.listingAgent.name;
        }
      }

      // Mod time
      const rawModTime = property.modTime;
      const modTimeValue = rawModTime?.replace(
        /^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2}:\d{2})$/,
        "$1 $2"
      ); // → "2025-07-13 20:55:38"

      // Address breakdown
      const { streetNumber, street, suburb, state, postcode, country } =
        property.address || {};

      const suburbValue =
        typeof suburb === "object" && suburb._ ? suburb._ : suburb || "";

      // Features: key-value pairs
      const features = property.features || {};

      // Land details
      const landArea = parseFloat(property.landDetails?.area?._ || 0);
      const landAreaUnit = property.landDetails?.area?.unit || null;

      // Inspections
      const inspections = property.inspectionTimes?.inspection
        ? Array.isArray(property.inspectionTimes.inspection)
          ? property.inspectionTimes.inspection
          : [property.inspectionTimes.inspection]
        : [];

      // Eco friendly
      const ecoFriendly = property.ecoFriendly || {};

      // Gallery and documents
      const objects = property.objects || {};
      const gallery = [];
      const documents = [];

      // Process floorplans (add to gallery)
      if (objects.floorplan) {
        const floorplans = Array.isArray(objects.floorplan)
          ? objects.floorplan
          : [objects.floorplan];
        floorplans.forEach((fp) => {
          if (fp.url) {
            gallery.push({
              type: "floorplan",
              url: fp.url,
              id: fp.$?.id || null,
              modTime: fp.$?.modTime || null,
              format: fp.format || null,
            });
          }
        });
      }

      // Process images (add to gallery)
      if (objects.img) {
        const imgs = Array.isArray(objects.img) ? objects.img : [objects.img];
        imgs.forEach((img) => {
          if (img.url) {
            gallery.push({
              type: "image",
              url: img.url,
              id: img.$?.id || null,
              modTime: img.$?.modTime || null,
              format: img.format || null,
            });
          }
        });
      }

      // Process documents (add to documents array)
      if (objects.document) {
        const docs = Array.isArray(objects.document)
          ? objects.document
          : [objects.document];
        docs.forEach((doc) => {
          if (doc.url) {
            documents.push({
              id: doc.$?.id || null,
              modTime: doc.$?.modTime || null,
              url: doc.url,
              format: doc.format || null,
              title: doc.title || null,
              order: doc.order || null,
              folder: doc.folder || null,
            });
          }
        });
      }

      console.log(`Processing ${uniqueID} - Documents: ${documents.length}`);

      const [existingRows] = await pool.query(
        `SELECT mod_time FROM properties WHERE property_id = ?`,
        [uniqueID]
      );

      if (existingRows.length > 0) {
        const existingModTime = existingRows[0].mod_time;
        const existingDate = new Date(existingModTime);
        const incomingDate = new Date(modTimeValue);

        if (incomingDate <= existingDate) {
          console.log(
            `⏩ Skipped ${uniqueID} - incoming mod_time is not newer.`
          );
          continue;
        }
      }

      // 5. Insert into DB (upsert by uniqueID)
      await pool.query(
        `INSERT INTO properties (
          property_id,
          property_name,
          description,
          lifestyle_assets,
          street_number,
          street,
          suburb,
          state,
          postcode,
          country,
          listing_agent,
          land_area,
          land_area_unit,
          inspection_times,
          features,
          eco_friendly,
          gallery,
          property_documents,
          mod_time,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          property_name = VALUES(property_name),
          description = VALUES(description),
          lifestyle_assets = VALUES(lifestyle_assets),
          street_number = VALUES(street_number),
          street = VALUES(street),
          suburb = VALUES(suburb),
          state = VALUES(state),
          postcode = VALUES(postcode),
          country = VALUES(country),
          listing_agent = VALUES(listing_agent),
          land_area = VALUES(land_area),
          land_area_unit = VALUES(land_area_unit),
          inspection_times = VALUES(inspection_times),
          features = VALUES(features),
          eco_friendly = VALUES(eco_friendly),
          gallery = VALUES(gallery),
          property_documents = VALUES(property_documents),
          mod_time = VALUES(mod_time),
          updated_at = NOW()`,
        [
          uniqueID,
          headline,
          description,
          JSON.stringify([]),
          streetNumber,
          street,
          suburbValue,
          state,
          postcode,
          country,
          listingAgentName,
          landArea,
          landAreaUnit,
          JSON.stringify(inspections),
          JSON.stringify(features),
          JSON.stringify(ecoFriendly),
          JSON.stringify(gallery),
          JSON.stringify(documents),
          modTimeValue,
        ]
      );

      properties.push({ id: uniqueID, name: headline });
    }

    // 7. Clean up - delete any remaining temp files
    const remainingFiles = await fs.readdir(TEMP_DIR);
    for (const file of remainingFiles) {
      await fs.unlink(path.join(TEMP_DIR, file));
    }

    res.status(200).json({
      status: "success",
      message: `Synced ${properties.length} properties`,
      data: properties,
    });
  } catch (err) {
    console.error("FTP Sync Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  } finally {
    ftpClient.close();
  }
};
