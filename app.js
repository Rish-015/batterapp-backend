
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]); // optional DNS fix

// =======================
// IMPORTS
// =======================
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const startSlotResetCron = require("./cron/slotResetCron");

// =======================
// INIT APP
// =======================
const app = express();

// =======================
// CORS CONFIG
// =======================
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// =======================
// MIDDLEWARE
// =======================
app.use(express.json());

// =======================
// DATABASE CONNECTION
// =======================
connectDB()
  .then(() => {
    console.log("✅ MongoDB connected");
    startSlotResetCron();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
  });

// =======================
// ROUTES
// =======================
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/products", require("./routes/product.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/slots", require("./routes/slots.routes"));
app.use("/api/slot-availability", require("./routes/slotAvailability.routes"));
app.use("/api/zones", require("./routes/zones.routes"));
app.use("/api/delivery-partners", require("./routes/deliveryPartner.routes"));
app.use("/api/admin", require("./routes/admin.routes"));

// =======================
// HEALTH CHECK
// =======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Batter Delivery API is running",
  });
});

// =======================
// ERROR HANDLER
// =======================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
