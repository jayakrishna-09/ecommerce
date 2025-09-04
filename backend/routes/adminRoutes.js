import express from "express";
import {
  adminLogin,
  getAllUsers,
  createStore,
  getStores,
  getStoreById,
  updateStore,
  createProduct,
  getProducts,
  getProductById,
  patchProduct,   
  updateProduct,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth
router.post("/login", adminLogin);

// Users
router.get("/users", protect, adminOnly, getAllUsers);

// Stores
router.post("/stores", protect, adminOnly, createStore);
router.get("/stores", protect, adminOnly, getStores);
router.get("/stores/:id", protect, adminOnly, getStoreById);
router.put("/stores/:id", protect, adminOnly, updateStore);
router.patch("/stores/:id", protect, adminOnly, updateStore);

// Products
router.post("/products", protect, adminOnly, createProduct);
router.get("/products", protect, adminOnly, getProducts);
router.get("/products/:id", protect, adminOnly, getProductById);
router.put("/products/:id", protect, adminOnly, updateProduct);
router.patch("/products/:id", protect, adminOnly, patchProduct);

export default router;
