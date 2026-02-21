const mongoose = require("mongoose");

const slotAvailabilitySchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryZone",
      required: true
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliverySlot",
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    max_orders: {
      type: Number,
      required: true
    },
    available_orders: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

// 🔥 THIS LINE PREVENTS OverwriteModelError
module.exports =
  mongoose.models.SlotAvailability ||
  mongoose.model("SlotAvailability", slotAvailabilitySchema);
