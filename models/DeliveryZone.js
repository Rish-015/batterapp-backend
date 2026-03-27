const mongoose = require("mongoose");

const deliveryZoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  polygon: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  }
});

deliveryZoneSchema.index({ polygon: "2dsphere" });

module.exports = mongoose.model("DeliveryZone", deliveryZoneSchema);
