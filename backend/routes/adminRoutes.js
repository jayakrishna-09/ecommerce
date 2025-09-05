import express from "express";
import {
  adminLogin,
  getAllUsers,
  blockUser,
  unblockUser,
  createStore,
  getStores,
  getStoreById,
  updateStore,
  createProduct,
  getProducts,
  getProductById,
  patchProduct,
  updateProduct,
  getPendingStores,
  // approveStore,
  // rejectStore,
  updateStoreStatus,
  getPendingVendorRequests,
  // approveVendorRequest,
  // rejectVendorRequest,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth
router.post("/login", adminLogin);

// Users
router.get("/users", protect, adminOnly, getAllUsers);
router.patch("/users/:id/block", protect, adminOnly, blockUser);
router.patch("/users/:id/unblock", protect, adminOnly, unblockUser);

// Stores
router.post("/stores", protect, adminOnly, createStore);
router.get("/stores", protect, adminOnly, getStores);
router.get("/stores/:id", protect, adminOnly, getStoreById);
router.put("/stores/:id", protect, adminOnly, updateStore);
router.patch("/stores/:id", protect, adminOnly, updateStore);


// Store requests
router.get("/stores/pending", protect, adminOnly, getPendingStores);
// router.patch("/stores/:id/approve", protect, adminOnly, approveStore);
// router.patch("/stores/:id/reject", protect, adminOnly, rejectStore);
// write single api for both approve and reject
router.patch("/stores/:id/status", protect, adminOnly, updateStoreStatus);



// Products
router.post("/products", protect, adminOnly, createProduct);
router.get("/products", protect, adminOnly, getProducts);
router.get("/products/:id", protect, adminOnly, getProductById);
router.put("/products/:id", protect, adminOnly, updateProduct);
router.patch("/products/:id", protect, adminOnly, patchProduct);


//  Vendor store requests
router.get("/vendor-requests", protect, adminOnly, getPendingVendorRequests);
// router.patch("/vendor-requests/:id/approve", protect, adminOnly, approveVendorRequest);
// router.patch("/vendor-requests/:id/reject", protect, adminOnly, rejectVendorRequest);


export default router;
