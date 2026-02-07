const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");

const router = express.Router();

/**
 * ---------------------------------------
 * CREATE / LOGIN USER (PHONE BASED)
 * ---------------------------------------
 * POST /api/users
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address_text } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    let user = await User.findOne({ phone });

    // Existing user → login
    if (user) {
      return res.json(user);
    }

    // New user → create
    if (!name || !address_text) {
      return res.status(400).json({ error: "Name and address are required" });
    }

    user = await User.create({
      name,
      phone,
      email,
      addresses: [
        {
          address_text,
          is_default: true
        }
      ]
    });

    res.status(201).json(user);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ---------------------------------------
 * GET ALL USERS (ADMIN)
 * ---------------------------------------
 * GET /api/users
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * ---------------------------------------
 * GET USER BY ID
 * ---------------------------------------
 * GET /api/users/:id
 */
router.get("/:id", async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json(user);
});

/**
 * ---------------------------------------
 * UPDATE USER PROFILE
 * ---------------------------------------
 * PUT /api/users/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { name, email } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(updated);

  } catch (err) {
    res.status(400).json({ error: "Invalid update data" });
  }
});

/**
 * ---------------------------------------
 * ADD NEW ADDRESS
 * ---------------------------------------
 * POST /api/users/:id/address
 */
router.post("/:id/address", async (req, res) => {
  try {
    const { address_text, is_default } = req.body;

    if (!address_text) {
      return res.status(400).json({ error: "Address text is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // If new address is default → unset others
    if (is_default) {
      user.addresses.forEach(a => (a.is_default = false));
    }

    user.addresses.push({
      address_text,
      is_default: !!is_default
    });

    await user.save();
    res.json(user);

  } catch (err) {
    res.status(500).json({ error: "Failed to add address" });
  }
});

/**
 * ---------------------------------------
 * SET DEFAULT ADDRESS
 * ---------------------------------------
 * PATCH /api/users/:id/address/:addressId/default
 */
router.patch("/:id/address/:addressId/default", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses.forEach(addr => {
      addr.is_default = addr._id.toString() === req.params.addressId;
    });

    await user.save();
    res.json(user);

  } catch (err) {
    res.status(500).json({ error: "Failed to update default address" });
  }
});

/**
 * ---------------------------------------
 * DELETE ADDRESS
 * ---------------------------------------
 * DELETE /api/users/:id/address/:addressId
 */
router.delete("/:id/address/:addressId", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    // Ensure at least one default address
    if (!user.addresses.some(a => a.is_default) && user.addresses.length) {
      user.addresses[0].is_default = true;
    }

    await user.save();
    res.json(user);

  } catch (err) {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

module.exports = router;
