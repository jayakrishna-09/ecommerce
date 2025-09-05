import express from "express";
import { vendorRegister, vendorLogin, requestStore } from "../controllers/vendorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Vendor Authentication
router.post("/register", vendorRegister);
router.post("/login", vendorLogin);

// Store onboarding request
router.post("/stores/request", protect, requestStore);

export default router;
