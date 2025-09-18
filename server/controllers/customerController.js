import User from "../models/User.js";
import Product from "../models/Product.js";
import bcrypt from 'bcrypt';
import generateToken from "../utils/generateToken.js";


// Customer registration
export const registerCustomer = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

const saltRounds = 10; // Typical value

const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      password:hashedPassword, 
      role: "customer",
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, "customer"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Customer login
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: "customer" });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked by admin." });
    }

    // if (user.password !== password) {
    //   return res.status(401).json({ message: "Invalid credentials" });
    // }
    // Check if admin exists
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
    
      // Compare input password with hashed password in DB
      const isMatch = await bcrypt.compare(password, user.password);
    
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, "customer"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get customer profile
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id)
      .select("-password")
      .populate("bookmarks favorites cart.product", "title price");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update (PUT) customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const customer = await User.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    customer.name = name || customer.name;
    customer.email = email || customer.email;
    if (password) {
      customer.password = password; 
    }

    const updated = await customer.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Partial update (PATCH)
export const patchCustomerProfile = async (req, res) => {
  try {
    const updates = req.body;

    const customer = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// -------------------- BOOKMARKS --------------------
// adding bookmark
export const addBookmark = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (!customer.bookmarks.includes(productId)) {
      customer.bookmarks.push(productId);
      await customer.save();
    }

    res.json({ bookmarks: customer.bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// removing bookmark
export const removeBookmark = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.bookmarks = customer.bookmarks.filter(
      (id) => id.toString() !== productId
    );
    await customer.save();

    res.json({ bookmarks: customer.bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// getting bookmark
export const getBookmarks = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id).populate("bookmarks");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json({ bookmarks: customer.bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- FAVORITES --------------------
// adding fav
export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    if (!customer.favorites.includes(productId)) {
      customer.favorites.push(productId);
      await customer.save();
    }

    res.json({ favorites: customer.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// remove fav
export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.favorites = customer.favorites.filter(
      (id) => id.toString() !== productId
    );
    await customer.save();

    res.json({ favorites: customer.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getting fav
export const getFavorites = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id).populate("favorites");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json({ favorites: customer.favorites });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- CART --------------------
// add to cart
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const cartItem = customer.cart.find(
      (item) => item.product.toString() === productId
    );

    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      customer.cart.push({ product: productId, quantity });
    }

    await customer.save();
    res.json({ cart: customer.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const customer = await User.findById(req.user._id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.cart = customer.cart.filter(
      (item) => item.product.toString() !== productId
    );

    await customer.save();
    res.json({ cart: customer.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// getting cart items
export const getCart = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id).populate("cart.product");
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    res.json({ cart: customer.cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
