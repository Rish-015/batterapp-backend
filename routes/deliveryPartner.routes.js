const express = require("express");
const mongoose = require("mongoose");
const DeliveryPartner = require("../models/DeliveryPartner");
const DeliveryZone = require("../models/DeliveryZone");
const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * CREATE DELIVERY PARTNER (ADMIN)
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, vehicle_number, zone_id } = req.body;

    if (!name || !phone || !zone_id) {
      return res.status(400).json({ error: "name, phone and zone_id are required" });
    }

    if (!isValidObjectId(zone_id)) {
      return res.status(400).json({ error: "Invalid zone_id" });
    }

    const zone = await DeliveryZone.findById(zone_id);
    if (!zone || !zone.isActive) {
      return res.status(400).json({ error: "Zone not found or inactive" });
    }

    const existingPhone = await DeliveryPartner.findOne({ phone });
    if (existingPhone) {
      return res.status(409).json({ error: "Phone number already exists" });
    }

    const partner = await DeliveryPartner.create({
      name,
      phone,
      vehicle_number,
      zone_id
    });

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
    const { available, active, zone_id } = req.query;

    const filters = {};
    if (available === "true" || available === "false") {
      filters.is_available = available === "true";
    }
    if (active === "true" || active === "false") {
      filters.is_active = active === "true";
    }
    if (zone_id) {
      if (!isValidObjectId(zone_id)) {
        return res.status(400).json({ error: "Invalid zone_id" });
      }
      filters.zone_id = zone_id;
    }

    const partners = await DeliveryPartner.find(filters)
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
    if (!isValidObjectId(req.params.zoneId)) {
      return res.status(400).json({ error: "Invalid zone ID" });
    }

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
 * GET PARTNER BY ID
 */
router.get("/:partnerId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }

    const partner = await DeliveryPartner.findById(req.params.partnerId).populate("zone_id", "name");

    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json(partner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * UPDATE PARTNER AVAILABILITY
 */
router.put("/:partnerId/availability", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }

    const { is_available } = req.body;

    if (typeof is_available !== "boolean") {
      return res.status(400).json({ error: "is_available must be boolean" });
    }

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
 * UPDATE PARTNER ACTIVE STATUS
 */
router.put("/:partnerId/active", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }

    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    const updates = {
      is_active,
      is_available: is_active ? undefined : false
    };

    if (updates.is_available === undefined) {
      delete updates.is_available;
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.partnerId,
      updates,
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
    if (!isValidObjectId(req.params.partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }

    const { name, phone, vehicle_number, zone_id, is_active, is_available } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (vehicle_number !== undefined) updates.vehicle_number = vehicle_number;
    if (is_active !== undefined) updates.is_active = is_active;
    if (is_available !== undefined) updates.is_available = is_available;

    if (is_active !== undefined && typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be boolean" });
    }

    if (is_available !== undefined && typeof is_available !== "boolean") {
      return res.status(400).json({ error: "is_available must be boolean" });
    }

    if (zone_id !== undefined) {
      if (!isValidObjectId(zone_id)) {
        return res.status(400).json({ error: "Invalid zone_id" });
      }

      const zone = await DeliveryZone.findById(zone_id);
      if (!zone || !zone.isActive) {
        return res.status(400).json({ error: "Zone not found or inactive" });
      }

      updates.zone_id = zone_id;
    }

    if (phone !== undefined) {
      const phoneTaken = await DeliveryPartner.findOne({
        phone,
        _id: { $ne: req.params.partnerId }
      });

      if (phoneTaken) {
        return res.status(409).json({ error: "Phone number already exists" });
      }
    }

    if (updates.is_active === false) {
      updates.is_available = false;
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.partnerId,
      updates,
      { new: true, runValidators: true }
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
 * DELETE PARTNER (SOFT DELETE)
 */
router.delete("/:partnerId", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.params.partnerId,
      { is_active: false, is_available: false },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }

    res.json({ message: "Partner deactivated successfully", partner });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;