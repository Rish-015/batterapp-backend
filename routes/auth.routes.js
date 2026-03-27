const express = require("express");
const jwt = require("jsonwebtoken");
const OTP = require("../models/OTP");
const User = require("../models/User");

const router = express.Router();

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
    user = await User.create({ phone });
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
});

module.exports = router;
