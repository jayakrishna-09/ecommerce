// import User from "../models/User.js";
// import Store from "../models/Store.js";
// import Product from "../models/Product.js";
// import generateToken from "../utils/generateToken.js";


// // Admin Login
// export const adminLogin = async (req, res) => {
//   const { email, password } = req.body;

//   const admin = await User.findOne({ email, role: "admin" });
//   if (!admin) return res.status(401).json({ message: "Invalid credentials" });

//   // Plain text password check
//   if (password !== admin.password) {
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   res.json({
//     _id: admin._id,
//     name: admin.name,
//     email: admin.email,
//     role: admin.role,
//     token: generateToken(admin._id, "admin"),
//   });
// };

// // Get all users
// export const getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find(); 
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// // Block user
// export const blockUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { isBlocked: true },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ message: "User blocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Unblock user
// export const unblockUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { isBlocked: false },
//       { new: true }
//     );

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ message: "User unblocked successfully", user });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // Create Store
// export const createStore = async (req, res) => {
//   try {
//     const store = await Store.create(req.body);
//     res.status(201).json(store);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// // Get all stores
// export const getStores = async (req, res) => {
//   try {
//     const stores = await Store.find();
//     res.json(stores);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Update store (PUT / PATCH)
// export const updateStore = async (req, res) => {
//   try {
//     const store = await Store.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true }
//     );

//     if (!store) {
//       return res.status(404).json({ message: "Store not found" });
//     }

//     res.json(store);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };



// // Get store by ID
// export const getStoreById = async (req, res) => {
//   try {
//     const store = await Store.findById(req.params.id);
//     if (!store) {
//       return res.status(404).json({ message: "Store not found" });
//     }
//     res.json(store);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// // CRUD for products
// export const createProduct = async (req, res) => {
//   const { title, price, store } = req.body;
//   const product = await Product.create({ title, price, store });
//   res.status(201).json(product);
// };

// export const getProducts = async (req, res) => {
//   const products = await Product.find().populate("store");
//   res.json(products);
// };

// // Get product by ID
// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }
//     res.json(product);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// export const updateProduct = async (req, res) => {
//   const product = await Product.findById(req.params.id);
//   if (!product) return res.status(404).json({ message: "Product not found" });

//   product.title = req.body.title || product.title;
//   product.price = req.body.price || product.price;
//   await product.save();

//   res.json(product);
// };



// // PATCH product (partial update)
// export const patchProduct = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndUpdate(
//       req.params.id,
//       { $set: req.body },       
//       { new: true, runValidators: true }
//     );

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.json(product);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };



// // // Get all store requests (pending)
// export const getPendingStores = async (req, res) => {
//   try {
//     const stores = await Store.find({ status: "pending" }).populate("vendor", "name email");
//     res.json(stores);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Approve store
// export const approveStore = async (req, res) => {
//   try {
//     const store = await Store.findById(req.params.id);
//     if (!store) return res.status(404).json({ message: "Store not found" });

//     store.status = "approved";
//     await store.save();

//     // link store to vendor
//     await User.findByIdAndUpdate(store.vendor, { store: store._id });

//     res.json({ message: "Store approved successfully", store });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Reject store
// export const rejectStore = async (req, res) => {
//   try {
//     const store = await Store.findById(req.params.id);
//     if (!store) return res.status(404).json({ message: "Store not found" });

//     store.status = "rejected";
//     await store.save();

//     res.json({ message: "Store rejected", store });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // writing in sinle Approve | reject |pending
// export const updateStoreStatus = async (req, res) => {
//   try {
//     const { status } = req.body; 
//     const store = await Store.findById(req.params.id);

//     if (!store) return res.status(404).json({ message: "Store not found" });

//     if (!["approved", "rejected", "pending"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status" });
//     }

//     store.status = status;
//     await store.save();

//     // If approved → link store to vendor
//     if (status === "approved") {
//       await User.findByIdAndUpdate(store.vendor, { store: store._id });
//     }

//     // If rejected/pending → unlink store from vendor
//     if (["rejected", "pending"].includes(status)) {
//       await User.findByIdAndUpdate(store.vendor, { $unset: { store: "" } });
//     }

//     res.json({ message: `Store marked as ${status}`, store });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// //  Get all pending vendor requests
// export const getPendingVendorRequests = async (req, res) => {
//   try {
//     const stores = await Store.find({ status: "pending" }).populate("vendor", "name email");
//     res.json(stores);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// //  Approve vendor request
// export const approveVendorRequest = async (req, res) => {
//   try {
//     const store = await Store.findByIdAndUpdate(
//       req.params.id,
//       { status: "approved" },
//       { new: true }
//     ).populate("vendor", "name email");

//     if (!store) return res.status(404).json({ message: "Store not found" });

//     res.json({ message: "Vendor approved successfully", store });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// //  Reject vendor request
// export const rejectVendorRequest = async (req, res) => {
//   try {
//     const store = await Store.findByIdAndUpdate(
//       req.params.id,
//       { status: "rejected" },
//       { new: true }
//     ).populate("vendor", "name email");

//     if (!store) return res.status(404).json({ message: "Store not found" });

//     res.json({ message: "Vendor rejected successfully", store });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };




















import User from "../models/User.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";
import generateToken from "../utils/generateToken.js";

// Admin Login
export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: "admin" });

  if (!admin || password !== admin.password) {
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

// Block / Unblock user
export const blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User blocked successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBlocked: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User unblocked successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create / Get / Update stores
export const createStore = async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.json(store);
  } catch (error) {
    res.status(400).json({ message: error.message });
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

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
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

export const patchProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get pending stores
export const getPendingStores = async (req, res) => {
  try {
    const stores = await Store.find({ status: "pending" })
      .populate("vendor", "name email");
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Single API: approve | reject | pending
export const updateStoreStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    store.status = status;
    await store.save();

    if (status === "approved") {
      await User.findByIdAndUpdate(store.vendor, { store: store._id });
    } else {
      await User.findByIdAndUpdate(store.vendor, { $unset: { store: "" } });
    }

    res.json({ message: `Store marked as ${status}`, store });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vendor requests (just pending)
export const getPendingVendorRequests = async (req, res) => {
  try {
    const stores = await Store.find({ status: "pending" })
      .populate("vendor", "name email");
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
