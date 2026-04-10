const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();
router.get("/test", (req, res) => {
  res.send("USER ROUTES WORKING");
});

/**
 * =======================================
 * CREATE NEW USER
 * =======================================
 * POST /api/users
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, address_text } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ error: "User with this phone already exists" });
    }

    const addresses = address_text ? [{ address_text, is_default: true }] : [];

    user = new User({
      name,
      phone,
      email,
      addresses
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user", details: err.message });
  }
});

/**
 * =======================================
 * GET ALL USERS
 * =======================================
 * GET /api/users
 */
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users", details: err.message });
  }
});


/**
 * =======================================
 * GET LOGGED-IN USER PROFILE
 * =======================================
 * GET /api/users/me
 */
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * =======================================
 * UPDATE USER PROFILE
 * =======================================
 * PUT /api/users/me
 */
router.put("/me", auth, async (req, res) => {
  try {
    const { name, email } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Invalid update data" });
  }
});

/**
 * =======================================
 * ADD NEW ADDRESS
 * =======================================
 * POST /api/users/me/address
 */
router.post("/me/address", auth, async (req, res) => {
  try {
    const { address_text, landmark, lat, lng, is_default } = req.body;

    if (!address_text) {
      return res.status(400).json({ error: "Address is required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (is_default) {
      user.addresses.forEach(a => (a.is_default = false));
    }

    user.addresses.push({
      address_text,
      landmark,
      lat,
      lng,
      is_default: !!is_default
    });

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to add address" });
  }
});

/**
 * =======================================
 * SET DEFAULT ADDRESS
 * =======================================
 * PATCH /api/users/me/address/:addressId/default
 */
router.patch("/me/address/:addressId/default", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
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
 * =======================================
 * DELETE ADDRESS
 * =======================================
 * DELETE /api/users/me/address/:addressId
 */
router.delete("/me/address/:addressId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    if (!user.addresses.some(a => a.is_default) && user.addresses.length) {
      user.addresses[0].is_default = true;
    }

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

/**
 * =======================================
 * GET ALL USERS (ADMIN)
 * =======================================
 * GET /api/users/admin/all
 */
router.get("/admin/all", async (req, res) => {
  try {
    const users = await User.find({ role: 'customer' }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
