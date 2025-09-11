import express from "express";
import {
    addProduct, 
    getProducts,
    getProductById,
    updateProduct,
    patchProduct,
    deleteProduct,
    getAllProducts,
} from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Vendors add products (requires login)
router.post("/", protect, addProduct);


// Public route - Get all products with pagination
router.get("/", getAllProducts);


// Get all products (public/admin)   //
router.get("/list", getProducts);

// Get product by ID
router.get("/:id", getProductById);

// Full update (PUT)
router.put("/:id", protect, updateProduct);

// Partial update (PATCH)
router.patch("/:id", protect, patchProduct);


// Delete a product
router.delete("/:id", protect, deleteProduct);




export default router;
