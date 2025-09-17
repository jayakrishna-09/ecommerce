import express from "express";
import { 
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
  updateCustomerProfile,
  patchCustomerProfile,
   addToCart,
  removeFromCart,
  getCart,
  addBookmark,
  removeBookmark,
  getBookmarks,
  addFavorite,
  removeFavorite,
  getFavorites
 } from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer auth
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Profile (protected routes)
router.get("/profile", protect, getCustomerProfile);
router.put("/profile", protect, updateCustomerProfile);
router.patch("/profile", protect, patchCustomerProfile);


// Cart
router.post("/cart/:productId", protect, addToCart);      
router.delete("/cart/:productId", protect, removeFromCart); 
router.get("/cart", protect, getCart);                      

// Bookmarks
router.post("/bookmarks/:productId", protect, addBookmark);
router.delete("/bookmarks/:productId", protect, removeBookmark);
router.get("/bookmarks", protect, getBookmarks);

// Favorites 
router.post("/favorites/:productId", protect, addFavorite);
router.delete("/favorites/:productId", protect, removeFavorite);
router.get("/favorites", protect, getFavorites);

export default router;
