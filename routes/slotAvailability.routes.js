const express = require("express");
const router = express.Router();
const SlotAvailability = require("../models/slotAvailability");

// CREATE / UPDATE availability
router.post("/", async (req, res) => {
  try {
    const {
      zone_id,
      slot_id,
      date,
      max_orders,
      available_orders
    } = req.body;

    if (!zone_id || !slot_id || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upsert: one slot per date
    const availability = await SlotAvailability.findOneAndUpdate(
      { zone_id, slot_id, date },
      { max_orders, available_orders },
      { new: true, upsert: true }
    );

    res.status(201).json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET availability by zone and date
router.get("/", async (req, res) => {
  try {
    const { zone_id, date } = req.query;
    if (!zone_id || !date) {
      return res.status(400).json({ error: "zone_id and date are required" });
    }

    const availability = await SlotAvailability.find({ zone_id, date });
    res.json(availability);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
