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

export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("store", "name location");
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
