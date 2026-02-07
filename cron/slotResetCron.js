const cron = require("node-cron");
const Slot = require("../models/DeliverySlot");

const startSlotResetCron = () => {
  // Runs every day at 12:00 AM
  cron.schedule("0 0 * * *", async () => {
    try {
      console.log("⏰ Slot reset cron started");

      await Slot.updateMany(
        {},
        {
          $set: {
            booked_orders: 0,
            is_active: true
          }
        }
      );

      console.log("✅ Delivery slots reset successfully");
    } catch (error) {
      console.error("❌ Slot reset cron failed:", error);
    }
  });
};

module.exports = startSlotResetCron;
