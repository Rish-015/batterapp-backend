const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Stock = require("../models/Stock");
const Product = require("../models/Product");
const SlotAvailability = require("../models/slotAvailability");

/**
 * PLACE ORDER (USER)
 */
router.post("/", async (req, res) => {
  let slotReservation = null;

  try {
    const {
      user_id,
      zone_id,
      slot_availability_id,
      delivery_date,
      address_text,
      payment_method,
      items
    } = req.body;

    /* ---------------- VALIDATION ---------------- */

    if (
      !user_id ||
      !zone_id ||
      !slot_availability_id ||
      !delivery_date ||
      !address_text ||
      !payment_method ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({ error: "Missing required order data" });
    }

    if (!["COD", "UPI", "ONLINE"].includes(payment_method)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    /* ---------- STEP 1: RESERVE SLOT (ATOMIC) ---------- */

    const slotReservation = await SlotAvailability.findOneAndUpdate(
  {
    _id: slot_availability_id,
    zone_id,
    date: delivery_date,
    available_orders: { $gt: 0 },
    is_active: true
  },
  { $inc: { available_orders: -1 } },
  { new: true }
).populate("slot_availability_id");

    /* ---------- STEP 2: VALIDATE PRODUCTS & STOCK ---------- */

    let orderItems = [];
    let total_price = 0;

    for (const item of items) {
      const product = await Product.findById(item.product_id);

      if (!product || !product.is_active) {
        throw new Error("Invalid or inactive product");
      }

      const stock = await Stock.findOne({
        product_id: item.product_id,
        date: delivery_date
      });

      if (!stock || stock.available_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      orderItems.push({
        product_id: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      });

      total_price += product.price * item.quantity;
    }

    /* ---------- STEP 3: DEDUCT STOCK ---------- */

    for (const item of items) {
      await Stock.findOneAndUpdate(
        { product_id: item.product_id, date: delivery_date },
        { $inc: { available_quantity: -item.quantity } }
      );
    }

    /* ---------- STEP 4: CREATE ORDER ---------- */

    const order = await Order.create({
      user_id,
      zone_id,
      slot_availability_id,
      delivery_date,
      delivery_slot: slotReservation.slot_id.name,
      address_text,
      payment_method,
      items: orderItems,
      total_price,
      status: "PLACED"
    });

    res.status(201).json(order);

  } catch (err) {
    console.error(err.message);

    /* ---------- ROLLBACK SLOT IF FAILURE ---------- */
    if (slotReservation) {
      await SlotAvailability.findByIdAndUpdate(
        slotReservation._id,
        { $inc: { available_orders: 1 } }
      );
    }

    res.status(500).json({ error: err.message });
  }
});

/**
 * GET ORDERS BY USER
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.params.userId })
      .populate({
        path: "slot_availability_id",
        populate: { path: "slot_id", select: "name start_time end_time" }
      })
      .populate("zone_id", "name")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET ALL ORDERS (ADMIN)
 */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user_id", "name phone")
      .populate("zone_id", "name")
      .populate({
        path: "slot_availability_id",
        populate: { path: "slot_id", select: "name start_time end_time" }
      })
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
router.put("/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["PLACED", "CONFIRMED", "DELIVERED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
