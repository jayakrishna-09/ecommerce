import express from "express";
import { addProduct, getProducts } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Vendors add products (requires login)
router.post("/", protect, addProduct);

// Get all products (public/admin)
router.get("/", getProducts);

export default router;
