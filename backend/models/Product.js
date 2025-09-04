import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    price: { type: Number, required: true},
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
