const express = require("express");
const DeliverySlot = require("../models/DeliverySlot");
const router = express.Router();

// Admin create slot
router.post("/", async (req, res) => {
  const slot = await DeliverySlot.create(req.body);
  res.json(slot);
});

// Get active slots
router.get("/", async (req, res) => {
  const slots = await DeliverySlot.find({ is_active: true });
  res.json(slots);
});

module.exports = router;
