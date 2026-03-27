const express = require("express");
const DeliveryZone = require("../models/DeliveryZone");

const router = express.Router();

/**
 * POST /api/zones (ADMIN)
 */
router.post("/", async (req, res) => {
  try {
    const { name, polygon, isActive } = req.body;

    if (!name || !polygon) {
      return res.status(400).json({ error: "name and polygon required" });
    }

    const zone = await DeliveryZone.create({
      name,
      polygon,
      isActive: isActive !== false
    });

    res.status(201).json(zone);
  } catch (err) {
    res.status(500).json({ error: "Zone creation failed" });
  }
});

/**
 * GET /api/zones (ADMIN)
 */
router.get("/", async (req, res) => {
  try {
    const zones = await DeliveryZone.find().sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

/**
 * POST /api/zones/detect
 */
router.post("/detect", async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat & lng required" });
    }

    const zone = await DeliveryZone.findOne({
      polygon: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat]
          }
        }
      }
    });

    if (!zone) {
      return res.json({
        zoneValid: false,
        message: "Not delivering in this area"
      });
    }

    if (!zone.isActive) {
      return res.json({
        zoneValid: true,
        isActive: false,
        zoneId: zone._id,
        zoneName: zone.name,
        message: "Zone closed"
      });
    }

    res.json({
      zoneValid: true,
      isActive: true,
      zoneId: zone._id,
      zoneName: zone.name,
      message: "Delivery available"
    });

  } catch (err) {
    res.status(500).json({ error: "Zone detection failed" });
  }
});

module.exports = router;
