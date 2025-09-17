import Product from "../models/Product.js";
import Store from "../models/Store.js";

export const addProduct = async (req, res) => {
  try {
    const { title, price, description } = req.body;

    // Find vendor's approved store
    const store = await Store.findOne({ vendor: req.user._id, status: "approved" });
    if (!store) {
      return res.status(400).json({ message: "You must have an approved store to add products" });
    }

    const product = new Product({
      title,
      price,
      description,
      store: store._id
    });

    await product.save();
    res.status(201).json(product);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("store", "name location");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("store", "name location");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update product (PUT → full update)
export const updateProduct = async (req, res) => {
  try {
    const { title, price, description } = req.body;

    let product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Ensure vendor owns the product
    const store = await Store.findOne({ vendor: req.user._id, _id: product.store });
    if (!store) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    product.title = title;
    product.price = price;
    product.description = description;

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Patch product (partial update)
export const patchProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const store = await Store.findOne({ vendor: req.user._id, _id: product.store });
    if (!store) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    Object.assign(product, req.body); // merge updates
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Ensure only the vendor who owns the store can delete
    const store = await Store.findById(product.store);
    if (!store || store.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all products (with pagination) - For customers
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find()
      .populate("store", "name location")
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments();

    res.json({
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error: error.message });
  }
};





