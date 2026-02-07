const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const upload = require("../middleware/upload"); // multer + cloudinary

/**
 * GET ALL ACTIVE PRODUCTS (USER)
 */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ is_active: true })
      .sort({ created_at: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET PRODUCT BY ID (USER)
 */
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      is_active: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(400).json({ error: "Invalid product ID" });
  }
});

/**
 * CREATE PRODUCT (ADMIN) — WITH IMAGE
 */
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, price, weight } = req.body;

    if (!name || !price || !weight) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (price <= 0) {
      return res.status(400).json({ error: "Invalid price" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Product image is required" });
    }

    const product = await Product.create({
      name,
      price,
      weight,
      image_url: req.file.path,
      image_public_id: req.file.filename || req.file.public_id, // Cloudinary URL
      is_active: true,
    });

    res.status(201).json(product);
  } catch (err) {
  console.error("PRODUCT CREATE ERROR:", err);
  res.status(500).json({
    error: err.message || "Product creation failed",
  });
}

});

/**
 * UPDATE PRODUCT (ADMIN) — IMAGE OPTIONAL
 */
const cloudinary = require("../config/cloudinary");

router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // If new image uploaded → delete old image
    if (req.file) {
      await cloudinary.uploader.destroy(product.image_public_id);

      product.image_url = req.file.path;
      product.image_public_id = req.file.filename || req.file.public_id;
    }

    // Update other fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.price) product.price = req.body.price;
    if (req.body.weight) product.weight = req.body.weight;
    if (req.body.is_active !== undefined)
      product.is_active = req.body.is_active;

    await product.save();
    res.json(product);

  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

/** DELETE PRODUCT (ADMIN)
 */
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete image from Cloudinary
    await cloudinary.uploader.destroy(product.image_public_id);

    // Delete product from DB
    await product.deleteOne();

    res.json({ message: "Product and image deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: "Deletion failed" });
  }
});


/**
 * DISABLE PRODUCT (ADMIN)
 */
router.patch("/:id/disable", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    res.json({ message: "Product disabled" });
  } catch (err) {
    res.status(400).json({ error: "Invalid product ID" });
  }
});

/**
 * ENABLE PRODUCT (ADMIN)
 */
router.patch("/:id/enable", async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { is_active: true });
    res.json({ message: "Product enabled" });
  } catch (err) {
    res.status(400).json({ error: "Invalid product ID" });
  }
});

/**
 * ADMIN – GET ALL PRODUCTS
 */
router.get("/admin/all", async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ created_at: -1 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;
