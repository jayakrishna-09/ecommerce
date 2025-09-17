import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    location: { type: String, required: true },
    gstNumber: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactNumber: { type: String },

    // link store to vendor
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // approval status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);
export default Store;
