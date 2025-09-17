import express from "express";
import { 
  vendorRegister, 
  vendorLogin, 
  requestStore,
  getVendorProfile,
  updateVendorProfile,
  patchVendorProfile,
} from "../controllers/vendorController.js";
import { protect, vendorOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Vendor Authentication
router.post("/register", vendorRegister);
router.post("/login", vendorLogin);

// Store onboarding request
router.post("/stores/request", protect, requestStore);


// Vendor profile
router.get("/profile", protect, vendorOnly, getVendorProfile);
router.put("/profile", protect, vendorOnly, updateVendorProfile);
router.patch("/profile", protect, vendorOnly, patchVendorProfile);

export default router;
