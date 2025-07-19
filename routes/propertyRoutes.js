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

const router = express.Router();

// Public routes (viewing)
router.get("/fix-documents", downloadPropertyDocs);
router.get("/sync", syncPropertiesFromFTP);
router.get("/fix", fixPropertiesFromFTP);
router.get("/", getAllProperties);
router.get("/:id", getProperty);

// Protected admin routes (modification)
router.use(protect); // All routes below this will require authentication

router.post("/", createProperty);
router.patch("/:id", upload.array("assets"), updateProperty);
router.delete("/:id", deleteProperty);
router.put("/:id", updateStatus);

export default router;
