const express = require("express");
const DeliveryZone = require("../models/DeliveryZone");
const router = express.Router();

// Admin create zone
router.post("/", async (req, res) => {
  const zone = await DeliveryZone.create({ name: req.body.name });
  res.json(zone);
});

// Get active zones (USER)
router.get("/", async (req, res) => {
  const zones = await DeliveryZone.find({ is_active: true });
  res.json(zones);
});

module.exports = router;
