const express = require("express");
const auth = require("../middleware/auth");
const Order = require("../models/Order");
const Stock = require("../models/Stock");
const SlotAvailability = require("../models/SlotAvailability");
const DeliveryZone = require("../models/DeliveryZone");
const DeliverySlot = require("../models/DeliverySlot");
const Product = require("../models/Product");
const User = require("../models/User");
const router = express.Router();

function normalizeDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

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
