import express from "express";
const router = express.Router();

// temporary test route
router.get("/", (req, res) => {
  res.send("Customer routes working...");
});

export default router;
