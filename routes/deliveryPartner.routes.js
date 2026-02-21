const express = require("express");
const DeliveryPartner = require("../models/DeliveryPartner");
const router = express.Router();

/**
 * CREATE DELIVERY PARTNER (ADMIN)
 */
router.post("/", async (req, res) => {
  try {
    const partner = await DeliveryPartner.create(req.body);
    res.status(201).json(partner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET ALL DELIVERY PARTNERS (ADMIN)
 */
router.get("/", async (req, res) => {
  try {
    const partners = await DeliveryPartner.find()
      .populate("zone_id", "name")
      .sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET PARTNERS BY ZONE
 */
router.get("/zone/:zoneId", async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({
      zone_id: req.params.zoneId,
      is_active: true
    });
    res.json(partners);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE PARTNER AVAILABILITY
 */
router.put("/:partnerId/availability", async (req, res) => {
  try {
    const { is_available } = req.body;
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.partnerId,
      { is_available },
      { new: true }
    );
    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    res.json(partner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE PARTNER STATUS
 */
router.put("/:partnerId", async (req, res) => {
  try {
    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.partnerId,
      req.body,
      { new: true }
    );
    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    res.json(partner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;