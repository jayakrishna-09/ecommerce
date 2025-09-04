import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // plain text (not hashed)
    role: { type: String, enum: ["customer", "vendor", "admin"], default: "customer" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
