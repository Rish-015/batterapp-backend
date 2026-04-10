const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  pincodes: {
    type: [String],
    required: true,
    index: true
  }
}, { timestamps: true });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);
