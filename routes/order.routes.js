const express = require("express");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const SlotAvailability = require("../models/SlotAvailability");
const DeliveryZone = require("../models/DeliveryZone");
const DeliverySlot = require("../models/DeliverySlot");
const Product = require("../models/Product");
const User = require("../models/User");
const DeliveryPartner = require("../models/DeliveryPartner");
const router = express.Router();

function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

/**
 * GET ALL ORDERS (ADMIN)
 */
router.get("/admin/all", auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status, zoneId, date } = req.query;
    const filter = {};
    if (status && status !== 'ALL') filter.status = status;
    if (zoneId) filter.zone_id = zoneId;
    if (date) filter.delivery_date = normalizeDate(date);

    const orders = await Order.find(filter)
      .populate("user_id", "name phone email")
      .populate("zone_id", "name")
      .populate("delivery_partner_id", "name phone")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET PRODUCTION SUMMARY (ADMIN)
 * Returns zone-wise breakdown of orders and product quantities for a date
 */
router.get("/admin/production-summary", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const summary = await Order.aggregate([
      { 
        $match: { 
          delivery_date: date, 
          status: { $ne: 'CANCELLED' } 
        } 
      },
      {
        $group: {
          _id: "$zone_id",
          ordersCount: { $sum: 1 },
          items: { $push: "$items" }
        }
      }
    ]);

    // Populate zone names
    const populatedSummary = await DeliveryZone.populate(summary, {
      path: "_id",
      select: "name"
    });

    // Format output: { zoneId: { name, ordersCount, products: { productId: quantity } } }
    const result = populatedSummary.reduce((acc, curr) => {
      const zoneId = curr._id?._id || curr._id;
      const zoneName = curr._id?.name || "Unknown";
      
      const productMap = {};
      curr.items.flat().forEach(item => {
        productMap[item.product_id] = (productMap[item.product_id] || 0) + item.quantity;
      });

      acc[zoneId] = {
        name: zoneName,
        ordersCount: curr.ordersCount,
        products: productMap
      };
      return acc;
    }, {});

    res.json(result);
  } catch (err) {
    console.error("Production Summary Error:", err);
    res.status(500).json({ error: "Failed to generate production summary" });
  }
});

/**
 * GET PAYMENT SUMMARY (ADMIN)
 */
router.get("/admin/payment-summary", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });

    const orders = await Order.find({ 
      delivery_date: normalizeDate(date), 
      status: { $ne: 'CANCELLED' } 
    })
    .select("_id delivery_date payment_method total_price status createdAt")
    .sort({ createdAt: -1 });

    const stats = orders.reduce((acc, order) => {
      acc.totalRevenue += order.total_price;
      if (order.payment_method === 'COD') {
        acc.codTotal += order.total_price;
      } else {
        acc.onlineTotal += order.total_price;
      }
      return acc;
    }, { totalRevenue: 0, onlineTotal: 0, codTotal: 0 });

    res.json({ orders, stats });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch payment summary" });
  }
});

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: status.toUpperCase() },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Status update failed" });
  }
});

/**
 * ASSIGN DELIVERY PARTNER (ADMIN)
 */
router.patch("/:id/assign", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access denied" });
    }

    const { partnerId } = req.body;
    const partner = await DeliveryPartner.findById(partnerId);
    if (!partner) return res.status(404).json({ error: "Partner not found" });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        delivery_partner_id: partnerId,
        status: 'SHIPPED' // Automatically mark as shipped when assigned
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Partner assignment failed" });
  }
});

/**
 * POST /api/orders
 */
router.post("/", auth, async (req, res) => {
  try {
    const { productId, quantity, slotId, zoneId, paymentMode, date } = req.body;

    if (!productId || !slotId || !zoneId || !paymentMode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedQty = Number(quantity);
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const zone = await DeliveryZone.findById(zoneId);
    if (!zone || !zone.isActive) {
      return res.status(400).json({ error: "Zone not available" });
    }

    const deliveryDate = normalizeDate(date || new Date());

    const slotAvailability = await SlotAvailability.findOne({
      slot_id: slotId,
      zone_id: zoneId,
      date: deliveryDate,
      available_orders: { $gt: 0 }
    });

    if (!slotAvailability) {
      return res.status(400).json({ error: "Slot full" });
    }

    const stock = await Stock.findOne({
      product_id: productId,
      date: deliveryDate
    });

    if (!stock || stock.available_quantity < parsedQty) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.is_active) {
      return res.status(400).json({ error: "Product not available" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const defaultAddress =
      user.addresses.find((addr) => addr.is_default) || user.addresses[0];

    if (!defaultAddress) {
      return res.status(400).json({ error: "No address on file" });
    }

    const slot = await DeliverySlot.findById(slotId);
    const deliverySlotName = slot ? slot.name : "Unknown";

    const totalPrice = product.price * parsedQty;

    const order = await Order.create({
      user_id: req.user.userId,
      zone_id: zoneId,
      slot_availability_id: slotAvailability._id,
      delivery_slot: deliverySlotName,
      delivery_date: deliveryDate,
      items: [
        {
          product_id: product._id,
          name: product.name,
          price: product.price,
          quantity: parsedQty
        }
      ],
      total_price: totalPrice,
      address_text: defaultAddress.address_text,
      payment_method: paymentMode,
      status: "PLACED"
    });

    slotAvailability.available_orders -= 1;
    stock.available_quantity -= parsedQty;

    await slotAvailability.save();
    await stock.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: "Order creation failed" });
  }
});

/**
 * GET /api/orders/:id
 */
router.get("/:id", auth, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

module.exports = router;
