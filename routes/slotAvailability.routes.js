const express = require("express");
const SlotAvailability = require("../models/SlotAvailability");

const router = express.Router();

function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

/**
 * POST /api/slot-availability
 */
router.post("/", async (req, res) => {
  try {
    const { zone_id, slot_id, date, max_orders, available_orders } = req.body;

    if (!zone_id || !slot_id || !date || max_orders == null || available_orders == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const record = await SlotAvailability.create({
      zone_id,
      slot_id,
      date: normalizeDate(date),
      max_orders,
      available_orders
    });

    res.status(201).json(record);
  } catch {
    res.status(500).json({ error: "Failed to create slot availability" });
  }
});

/**
 * GET /api/slot-availability
 */
router.get("/", async (req, res) => {
  try {
    const zoneValue = req.query.zoneId || req.query.zone_id;
    const { date } = req.query;

    if (!zoneValue || !date) {
      return res.status(400).json({ error: "zoneId and date are required" });
    }

    const slots = await SlotAvailability.find({
      zone_id: zoneValue,
      date: normalizeDate(date),
      available_orders: { $gt: 0 }
    }).populate("slot_id");

    res.json(slots);
  } catch {
    res.status(500).json({ error: "Failed to fetch slots" });
  }
});

module.exports = router;
