const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const OTP = require("../models/OTP");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// 🔐 ADMIN LOGIN (Traditional Password)
router.post("/login-admin", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // Find admin by email or phone (using email as username for admin)
    const user = await User.findOne({ 
      $or: [{ email: username }, { phone: username }],
      role: 'admin' 
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token, 
      user: { id: user._id, name: user.name, role: user.role } 
    });

  } catch (err) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 🔐 REGISTER ADMIN (Initial Setup - Should be disabled in production)
router.post("/register-admin-internal", async (req, res) => {
  try {
    const { name, email, phone, password, secret } = req.body;

    // Simple security check for initial setup
    if (secret !== "BATTER_ADMIN_INIT_2026") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({ message: "Admin created successfully", admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- EXISTING OTP LOGIC ---

// SEND OTP
router.post("/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Phone required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await OTP.create({
    phone,
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  console.log("OTP:", otp);
  res.json({ message: "OTP sent", otp, phone });
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  const { phone, otp } = req.body;

  const record = await OTP.findOne({ phone, otp });
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  let user = await User.findOne({ phone });
  if (!user) {
    user = await User.create({ phone, role: 'customer' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, role: user.role });
});

// 🔐 CHANGE PASSWORD
router.post("/change-password", auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during password update" });
  }
});

module.exports = router;
