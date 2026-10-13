import pool from "../db/connection.js";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import xml2js from "xml2js";

// Constants
const TEMP_DIR = path.join(os.tmpdir(), "property-xml-temp");
const UPLOADS_DIR = "/home/xmluploader/uploads";
const RENTAL_DIR = path.join(UPLOADS_DIR, "rental");
const COMMERCIAL_DIR = path.join(UPLOADS_DIR, "commercial");

export const syncPropertiesFromFTP = async (req, res) => {
  console.log("🔁 Sync started from local folders...");

  try {
    const propertyFilesMap = new Map();
    await fs.mkdir(TEMP_DIR, { recursive: true });

    const sourceDirectories = [
      { dirPath: UPLOADS_DIR, defaultType: "residential" },
      { dirPath: RENTAL_DIR, defaultType: "rental" },
      { dirPath: COMMERCIAL_DIR, defaultType: "commercial" },
    ];

    // Step 1: Scan and map XML files from all source directories
    for (const source of sourceDirectories) {
      await fs.mkdir(source.dirPath, { recursive: true });
      const fileNames = await fs.readdir(source.dirPath);
      const xmlFiles = fileNames.filter(
        (name) => name.endsWith(".xml") && !name.startsWith(".")
      );

      for (const fileName of xmlFiles) {
        const localPath = path.join(source.dirPath, fileName);

        try {
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
          const property = propertyList[typeKey];
          if (!property || !property.uniqueID) continue;

          const uniqueID = property.uniqueID;
          const stat = await fs.stat(localPath);
          const modifiedAt = stat.mtime;

          const existing = propertyFilesMap.get(uniqueID);
          if (!existing || modifiedAt > existing.modifiedAt) {
            propertyFilesMap.set(uniqueID, {
              fileName,
              localPath,
              modifiedAt,
              propertyData: property,
              propertyType: typeKey,
            });
          }
        } catch (err) {
          console.error(`❌ Failed to process ${fileName} in ${source.dirPath}:`, err.message);
          continue;
        }
      }
    }

    if (propertyFilesMap.size === 0) {
      return res.status(200).json({
        status: "success",
        message: "No XML files found to sync.",
      });
    }

    const properties = [];

    // Step 2: Insert or update each latest property into DB
    for (const {
      fileName,
      localPath,
      modifiedAt,
      propertyData,
      propertyType,
    } of propertyFilesMap.values()) {
      const property = propertyData;

      const headline = property.headline;
      const description = property.description;

      // Helper function to extract CDATA or plain text
      const getValue = (field) => {
        if (!field) return null;
        if (typeof field === "object" && "_" in field) return field._;
        return field;
      };

      let listingAgentName = null;
      let listingAgentEmail = null;
      let contactAgent = null;
      let agentsList = [];

      if (property.listingAgent) {
        const rawAgents = Array.isArray(property.listingAgent)
          ? property.listingAgent
          : [property.listingAgent];

        rawAgents.forEach((ag, idx) => {
          if (!ag) return;
          const name = getValue(ag.name)?.trim() || null;
          const email = getValue(ag.email)?.trim() || null;
          const telephone = getValue(ag.telephone)?.trim() || null;
          const id = ag.$?.id || ag.id || String(idx + 1);

          if (name || telephone || email) {
            agentsList.push({
              id,
              name,
              email,
              telephone,
            });
          }
        });

        // Set primary agent values for backward compatibility
        if (agentsList.length > 0) {
          listingAgentName = agentsList[0].name;
          listingAgentEmail = agentsList[0].email;
          contactAgent = agentsList[0].telephone;
        }
      }

      const rawModTime = property.modTime;
      const modTimeValue =
        rawModTime?.replace(
          /^(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2}:\d{2})$/,
          "$1 $2"
        ) || modifiedAt.toISOString().slice(0, 19).replace("T", " ");

      const {
        subNumber,
        streetNumber,
        street,
        suburb,
        state,
        postcode,
        country,
      } = property.address || {};

      const safeSubNumber = subNumber ?? null;

      const suburbValue =
        typeof suburb === "object" && suburb._ ? suburb._ : suburb || "";

      const features = property.features || {};
      const landArea = parseFloat(property.landDetails?.area?._ || 0);
      const landAreaUnit = property.landDetails?.area?.unit || null;

      const inspections = property.inspectionTimes?.inspection
        ? Array.isArray(property.inspectionTimes.inspection)
          ? property.inspectionTimes.inspection
          : [property.inspectionTimes.inspection]
        : [];

      const ecoFriendly = property.ecoFriendly || {};
      const objects = property.objects || {};
      const gallery = [];
      const documents = [];

      if (objects.floorplan) {
        const fps = Array.isArray(objects.floorplan)
          ? objects.floorplan
          : [objects.floorplan];
        fps.forEach((fp) => {
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

      const [existingRows] = await pool.query(
        `SELECT mod_time, agents, price_view FROM properties WHERE property_id = ?`,
        [property.uniqueID]
      );

      const isForce = req.query.force === "true" || req.query.force === "1";

      if (!isForce && existingRows.length > 0 && existingRows[0].agents !== null && existingRows[0].price_view !== null) {
        const existingDate = new Date(existingRows[0].mod_time);
        const incomingDate = new Date(modTimeValue);
        if (incomingDate <= existingDate) {
          console.log(`⏩ Skipped ${property.uniqueID} - not newer`);
          continue;
        }
      }

      // Extract status attribute (e.g. status="withdrawn" or status="current")
      let statusValue = "current";
      if (typeof property.status === "string" && property.status.trim()) {
        statusValue = property.status.trim();
      } else if (property.$?.status) {
        statusValue = String(property.$.status).trim();
      } else if (property.status?._) {
        statusValue = String(property.status._).trim();
      }

      // Extract category attribute (e.g. name="House" or name="Unit")
      let categoryValue = null;
      if (property.category) {
        if (Array.isArray(property.category)) {
          categoryValue = property.category[0]?.name || null;
        } else if (typeof property.category === "object") {
          categoryValue = property.category.name || null;
        } else if (typeof property.category === "string") {
          categoryValue = property.category;
        }
      }

      // Extract videoLink attribute / tag
      let videoLinkUrl = null;
      if (property.videoLink) {
        if (Array.isArray(property.videoLink)) {
          videoLinkUrl = property.videoLink[0]?.href || null;
        } else if (typeof property.videoLink === "object") {
          videoLinkUrl = property.videoLink.href || null;
        } else if (typeof property.videoLink === "string") {
          videoLinkUrl = property.videoLink;
        }
      }

      // Extract priceView attribute / tag
      let priceViewValue = null;
      if (property.priceView) {
        priceViewValue = getValue(property.priceView)?.trim() || null;
      }

      // Extract auction attribute / tag
      let isAuctionValue = null;
      let auctionDateValue = null;

      // 1. Check authority tag e.g. <authority value="auction"/>
      const authorityValue =
        (typeof property.authority === "object"
          ? property.authority?.value || property.authority?.$?.value || property.authority?._
          : property.authority) || "";
      if (authorityValue && String(authorityValue).toLowerCase() === "auction") {
        isAuctionValue = 1;
      }

      // 2. Check auction tag e.g. <auction date="2026-10-10T10:00"/>
      if (property.auction) {
        isAuctionValue = 1;
        if (typeof property.auction === "object") {
          auctionDateValue =
            property.auction.date ||
            property.auction.$?.date ||
            property.auction.auctionDate ||
            property.auction._ ||
            null;
        } else if (typeof property.auction === "string") {
          auctionDateValue = property.auction.trim() || null;
        }
      }

      // 3. Check auctionDate tag
      if (property.auctionDate) {
        isAuctionValue = 1;
        auctionDateValue =
          auctionDateValue || getValue(property.auctionDate)?.trim() || null;
      }

      // 4. Check priceView e.g. <priceView>AUCTION</priceView>
      if (priceViewValue && /auction/i.test(priceViewValue)) {
        isAuctionValue = 1;
        if (!auctionDateValue) {
          const matchDate = priceViewValue
            .replace(/^(?:onsite\s+auction|auction\s*(?:onsite|on-site)?)\s*[:\-–]?\s*/i, "")
            .trim();
          if (matchDate) {
            auctionDateValue = matchDate;
          }
        }
      }

      // 5. Fallback: Check description for auction date if still not found
      if (isAuctionValue && !auctionDateValue && description) {
        const descText = typeof description === "string" ? description : getValue(description) || "";
        const descMatch = descText.match(
          /(?:onsite\s+auction|auction)\s*[:\-–]?\s*([A-Za-z]+,?\s*\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+(?:\s+(?:at\s+)?|\s*[:,\-–]\s*|\s+)\d{1,2}:\d{2}\s*(?:am|pm)?)/i
        );
        if (descMatch && descMatch[1]) {
          auctionDateValue = descMatch[1].trim();
        }
      }

      // Generate clean address slug (e.g. 405-moggill-road-indooroopilly-qld-4068)
      const addressParts = [
        safeSubNumber,
        streetNumber,
        street,
        suburbValue,
        state,
        postcode,
      ].filter(Boolean);
      const generatedSlug = addressParts
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const slugValue = generatedSlug || property.uniqueID;

      await pool.query(
        `INSERT INTO properties (
          property_id, property_name, description, lifestyle_assets, sub_number,
          street_number, street, suburb, state, postcode, country,
          listing_agent, contact_agent, agents, land_area, land_area_unit, inspection_times,
          features, eco_friendly, gallery, property_documents, mod_time,
          property_type, category, status, video_link, price_view, slug,
          auction, auction_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          property_name = VALUES(property_name),
          description = VALUES(description),
          sub_number = VALUES(sub_number),
          street_number = VALUES(street_number),
          street = VALUES(street),
          suburb = VALUES(suburb),
          state = VALUES(state),
          postcode = VALUES(postcode),
          country = VALUES(country),
          listing_agent = VALUES(listing_agent),
          contact_agent = VALUES(contact_agent),
          agents = VALUES(agents),
          land_area = VALUES(land_area),
          land_area_unit = VALUES(land_area_unit),
          inspection_times = VALUES(inspection_times),
          features = VALUES(features),
          eco_friendly = VALUES(eco_friendly),
          gallery = VALUES(gallery),
          property_documents = VALUES(property_documents),
          mod_time = VALUES(mod_time),
          property_type = VALUES(property_type),
          category = VALUES(category),
          status = VALUES(status),
          video_link = VALUES(video_link),
          price_view = VALUES(price_view),
          slug = VALUES(slug),
          auction = VALUES(auction),
          auction_date = VALUES(auction_date),
          updated_at = NOW()`,
        [
          property.uniqueID,
          headline,
          description,
          JSON.stringify([]),
          safeSubNumber,
          streetNumber,
          street,
          suburbValue,
          state,
          postcode,
          country,
          listingAgentName,
          contactAgent,
          agentsList.length > 0 ? JSON.stringify(agentsList) : null,
          landArea,
          landAreaUnit,
          JSON.stringify(inspections),
          JSON.stringify(features),
          JSON.stringify(ecoFriendly),
          JSON.stringify(gallery),
          JSON.stringify(documents),
          modTimeValue,
          propertyType,
          categoryValue,
          statusValue,
          videoLinkUrl,
          priceViewValue,
          slugValue,
          isAuctionValue,
          auctionDateValue,
        ]
      );

      properties.push({
        id: property.uniqueID,
        name: headline,
        apartment: safeSubNumber,
        street: streetNumber,
        suburb: suburbValue,
        state,
        postcode,
        type: propertyType,
        category: categoryValue,
        status: statusValue,
        video_link: videoLinkUrl,
        auction: isAuctionValue,
        auction_date: auctionDateValue,
      });
    }

    res.status(200).json({
      status: "success",
      message: `Synced ${properties.length} properties`,
      data: properties,
    });
  } catch (err) {
    console.error("❌ Sync Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};
