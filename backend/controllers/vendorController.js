import User from "../models/User.js";
import Store from "../models/Store.js";
import generateToken from "../utils/generateToken.js";

// Vendor Registration
export const vendorRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const vendor = await User.create({
      name,
      email,
      password, // plain for now (later we can hash)
      role: "vendor"
    });

    res.status(201).json({
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      token: generateToken(vendor._id, "vendor"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vendor Login
export const vendorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await User.findOne({ email, role: "vendor" });
    if (!vendor) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (vendor.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (vendor.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked by admin" });
    }

    res.json({
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      token: generateToken(vendor._id, "vendor"),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Vendor requests a store onboarding
export const requestStore = async (req, res) => {
  try {
    const { name, description, location, gstNumber, contactEmail, contactNumber } = req.body;

    // checking  if vendor already has a store
    const vendor = await User.findById(req.user._id);
    if (vendor.store) {
      return res.status(400).json({ message: "You already have a store linked" });
    }

    // create store with pending status
    const store = await Store.create({
      name,
      description,
      location,
      gstNumber,
      contactEmail,
      contactNumber,
      vendor: req.user._id,
      status: "pending"
    });

    res.status(201).json({
      message: "Store request submitted. Waiting for admin approval.",
      store
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};