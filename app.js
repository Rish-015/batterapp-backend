require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const startSlotResetCron = require("./cron/slotResetCron");

const app = express();

/* =======================
   DATABASE CONNECTION
======================= */
connectDB()
  .then(() => {
    startSlotResetCron();
  });

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(express.json());

/* =======================
   ROUTES
======================= */
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/slots", require("./routes/slots.routes"));
app.use("/api/slot-availability", require("./routes/slotAvailability.routes"));
app.use("/api/zones", require("./routes/zones.routes"));
app.use("/api/delivery-partners", require("./routes/deliveryPartner.routes"));

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.send("✅ Batter Delivery API is running");
});

/* =======================
   ERROR HANDLING (BASIC)
======================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
