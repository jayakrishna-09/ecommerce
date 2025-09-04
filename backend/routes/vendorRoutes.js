import express from "express";
const router = express.Router();

// temporary test route
router.get("/", (req, res) => {
  res.send("Vendor routes working...");
});

export default router;
