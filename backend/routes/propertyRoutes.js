import express from "express";
import { protect } from "../controllers/authController.js";
import path from "path";
import fs from "fs";
import {
  getAllProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  updateStatus,
} from "../controllers/propertyController.js";
import { syncPropertiesFromFTP } from "../controllers/propertySyncController.js";
import { fixPropertiesFromFTP } from "../controllers/propertyFixController.js";
import upload from "../middlewares/upload.js";
import { downloadPropertyDocs } from "../controllers/propertyDocumentsController.js";
import { verifyCronKey } from "../middlewares/verifyCronKey.js";

const router = express.Router();

// Public routes (viewing)
router.get("/fix-documents", verifyCronKey, downloadPropertyDocs);
router.get("/sync", verifyCronKey, syncPropertiesFromFTP);
router.get("/fix", verifyCronKey, fixPropertiesFromFTP);
router.get("/", getAllProperties);
router.get("/sales", (req, res, next) => {
  Object.defineProperty(req, "query", { value: { type: "residential" }, writable: true });
  getAllProperties(req, res, next);
});
router.get("/rentals", (req, res, next) => {
  Object.defineProperty(req, "query", { value: { type: "rental" }, writable: true });
  getAllProperties(req, res, next);
});
router.get("/commercial", (req, res, next) => {
  Object.defineProperty(req, "query", { value: { type: "commercial" }, writable: true });
  getAllProperties(req, res, next);
});
router.get("/:id", getProperty);

// Protected admin routes (modification)
router.use(protect); // All routes below this will require authentication

router.post("/", createProperty);
router.patch("/:id", upload.array("assets"), updateProperty);
router.delete("/:id", deleteProperty);
router.put("/:id", updateStatus);

export default router;
