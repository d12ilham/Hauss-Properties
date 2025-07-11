import pool from "../db/connection.js";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// Get all properties
export const getAllProperties = async (req, res) => {
  try {
    const [properties] = await pool.query("SELECT * FROM properties");

    const enhancedProperties = await Promise.all(
      properties.map(async (property) => {
        const qrLink = `${process.env.FONTEND_URL}/properties/${property.id}`; // or use property_id
        const qrCodeDataUrl = await QRCode.toDataURL(qrLink);

        return {
          ...property,
          qr_code: qrCodeDataUrl, // Add QR as base64 image
        };
      })
    );

    res.status(200).json({
      status: "success",
      results: enhancedProperties.length,
      data: { properties: enhancedProperties },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Get single property
export const getProperty = async (req, res) => {
  try {
    const [property] = await pool.query(
      "SELECT * FROM properties WHERE property_id = ?",
      [req.params.id]
    );

    if (property.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Property not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { property: property[0] },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Create property (Admin only)
export const createProperty = async (req, res) => {
  try {
    const { property_id, property_name, lifestyle_assets } = req.body;

    const [result] = await pool.query(
      `INSERT INTO properties 
       (property_id, property_name, lifestyle_assets) 
       VALUES (?, ?, ?)`,
      [property_id, property_name, JSON.stringify(lifestyle_assets)]
    );

    const [newProperty] = await pool.query(
      "SELECT * FROM properties WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      status: "success",
      data: { property: newProperty[0] },
    });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Update property (Admin only)
export const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Get current property data
    const [currentProperty] = await pool.query(
      "SELECT lifestyle_assets FROM properties WHERE property_id = ?",
      [propertyId]
    );

    // Parse existing assets
    let existingAssets = [];
    if (currentProperty[0]?.lifestyle_assets) {
      existingAssets =
        typeof currentProperty[0].lifestyle_assets === "string"
          ? JSON.parse(currentProperty[0].lifestyle_assets)
          : currentProperty[0].lifestyle_assets;
    }

    console.log("existingAssets", existingAssets);

    const keptAssets = existingAssets.filter(
      (asset) => req.body[`keep_asset_${asset.id}`] === "true"
    );

    const deletedAssets = existingAssets.filter(
      (asset) => req.body[`keep_asset_${asset.id}`] === "false"
    );

    deletedAssets.forEach((asset) => {
      const filePath = path.join(process.cwd(), asset.url);
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file at ${filePath}:`, err.message);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      } else {
        console.warn(`⚠️ File not found, skipping deletion: ${filePath}`);
      }
    });

    // Process updates to remaining assets
    const updatedAssets = keptAssets.map((asset) => {
      return {
        ...asset,
        title: req.body[`existing_title_${asset.id}`] || asset.title,
        description:
          req.body[`existing_description_${asset.id}`] || asset.description,
      };
    });

    // Process new assets
    const newAssets = (req.files || []).map((file, index) => {
      const fileType = file.mimetype.startsWith("video") ? "video" : "image";
      return {
        id: Date.now() + index,
        url: `/assets/${propertyId}/${file.filename}`,
        type: fileType,
        title: req.body[`new_title_${index}`] || file.originalname,
        description: req.body[`new_description_${index}`] || "",
      };
    });

    // Combine all assets
    const allAssets = [...updatedAssets, ...newAssets];

    console.log("allAssets", allAssets);

    // Update database
    const [result] = await pool.query(
      `UPDATE properties SET lifestyle_assets = ? WHERE property_id = ?`,
      [JSON.stringify(allAssets), propertyId]
    );

    // TODO: Add actual file deletion from filesystem here if needed

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ status: "fail", message: "Property not found" });
    }

    const [updatedProperty] = await pool.query(
      "SELECT * FROM properties WHERE property_id = ?",
      [propertyId]
    );

    res.status(200).json({
      status: "success",
      data: { property: updatedProperty[0] },
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(400).json({ status: "error", message: err.message });
  }
};

// Delete property (Admin only)
export const deleteProperty = async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM properties WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Property not found",
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const status = req.body.status;
    const [result] = await pool.query(
      "UPDATE properties SET active = ? WHERE property_id = ?",
      [status, propertyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Property not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: { property: { property_id: propertyId, status } },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
