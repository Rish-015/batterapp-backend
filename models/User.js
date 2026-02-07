const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address_text: { type: String, required: true },
  is_default: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String },
  addresses: [addressSchema]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
