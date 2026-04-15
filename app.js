require("dotenv").config();
const dns = require("dns");

// Force Node.js to use Google DNS to bypass ISP/Network blocks (ECONNREFUSED)
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const startSlotResetCron = require("./cron/slotResetCron");

const app = express();

/* =======================
   MIDDLEWARE (MUST BE FIRST)
======================= */
app.use(cors());
app.use(express.json());

/* =======================
   DATABASE CONNECTION
======================= */
connectDB().then(() => {
   startSlotResetCron();
});

/* =======================
   ROUTES
======================= */
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

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
   res.status(200).json({
      success: true,
      message: "Batter Delivery API is running",
      timestamp: new Date().toISOString(),
      endpoints: {
         users: "/api/users",
         products: "/api/products",
         stock: "/api/stock",
         orders: "/api/orders",
         slots: "/api/slots",
         slotAvailability: "/api/slot-availability",
         zones: "/api/zones",
         deliveryPartners: "/api/delivery-partners"
      }
   });
});

/* =======================
   ERROR HANDLING
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
