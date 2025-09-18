import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import User from "./models/User.js";
import bcrypt from "bcrypt"
dotenv.config();
connectDB();

const app = express();

// Proper CORS config
const corsOptions = {
    origin: ['http://localhost:5173'],  // Allowed origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],  // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
    credentials: true,
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Ensure express parses JSON body
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
//  const saltRounds = 10;
// async function hashExistingPasswords() {
//     try {
      
//         const users = await User.find();
//         for (const user of users) {
//             if (user.password && user.password.length < 60) {  // If not already hashed
//                 const hashed = await bcrypt.hash(user.password, saltRounds);
//                 user.password = hashed;
//                 await user.save();
//                 console.log(`Hashed password for user: ${user._id}`);
//             }
//         }
//         console.log('All existing passwords have been hashed.');
//         process.exit(0);
//     } catch (error) {
//         console.error('Error hashing passwords:', error);
//         process.exit(1);
//     }
// }

// hashExistingPasswords();

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
