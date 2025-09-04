import User from "../models/User.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";
import generateToken from "../utils/generateToken.js";


// Admin Login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await User.findOne({ email, role: "admin" });
  if (!admin) return res.status(401).json({ message: "Invalid credentials" });

  // Plain text password check
  if (password !== admin.password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json({
    _id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id, "admin"),
  });
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); 
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// Create Store
export const createStore = async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all stores
export const getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update store (PUT / PATCH)
export const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// Get store by ID
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// CRUD for products
export const createProduct = async (req, res) => {
  const { title, price, store } = req.body;
  const product = await Product.create({ title, price, store });
  res.status(201).json(product);
};

export const getProducts = async (req, res) => {
  const products = await Product.find().populate("store");
  res.json(products);
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  product.title = req.body.title || product.title;
  product.price = req.body.price || product.price;
  await product.save();

  res.json(product);
};



// PATCH product (partial update)
export const patchProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },       
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

