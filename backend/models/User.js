import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["customer", "vendor", "admin"], 
      default: "customer" 
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // linked after approval
    isBlocked: { type: Boolean, default: false },

     //  Customer-specific fields
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
