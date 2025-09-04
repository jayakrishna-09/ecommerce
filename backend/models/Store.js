// import mongoose from "mongoose";

// const storeSchema = mongoose.Schema(
//   {
//     name: { type: String, required: true, unique: true },
//     description: { type: String },
//     location:{type:String},
//     owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Store", storeSchema);





import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },

    // Onboarding details
    description: { type: String },
    gstNumber: { type: String, required: true ,unique: true },      
    contactEmail: { type: String, required: true ,unique: true ,match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,},   
    contactNumber: { type: String ,unique: true ,match: /^[6-9]\d{9}$/},                  
    address: { type: String },
    openingHours: { type: String },
    website: { type: String },
    isActive: { type: Boolean, default: true }        
  },
  { timestamps: true }
);

const Store = mongoose.model("Store", storeSchema);
export default Store;
