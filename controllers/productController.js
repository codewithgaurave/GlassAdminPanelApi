// controllers/productController.js
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { cloudinary } from "../config/cloudinary.js";

const parseMaybeJSON = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    if (typeof value === "string") {
      return value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return fallback;
  }
};

// CREATE
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      discountPercent,
      sizes,
      colors,
      addOns,
      description,
      about,
      categoryId,
    } = req.body;

    if (!name || !price || !categoryId) {
      return res
        .status(400)
        .json({ message: "name, price, categoryId required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }

    if (!req.files || !req.files.mainImage || !req.files.mainImage[0]) {
      return res.status(400).json({ message: "mainImage is required" });
    }

    const mainImageFile = req.files.mainImage[0];
    const galleryFiles = req.files.galleryImages || [];

    const galleryImages = galleryFiles.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));

    const parsedSizes = parseMaybeJSON(sizes, []);
    const parsedColors = parseMaybeJSON(colors, []);
    const parsedAddOns = parseMaybeJSON(addOns, []);

    const product = await Product.create({
      name,
      category: category._id,
      price: Number(price),
      discountPercent: Number(discountPercent || 0),
      mainImage: {
        url: mainImageFile.path,
        publicId: mainImageFile.filename,
      },
      galleryImages,
      sizes: parsedSizes,
      colors: parsedColors,
      addOns: parsedAddOns,
      description,
      about,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LIST
export const listProducts = async (_req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.json({ products });
  } catch (err) {
    console.error("listProducts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ONE
export const getProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product =
      (await Product.findOne({ slug: idOrSlug }).populate(
        "category",
        "name slug"
      )) ||
      (await Product.findById(idOrSlug).populate("category", "name slug"));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (err) {
    console.error("getProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE
export const updateProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    let product =
      (await Product.findOne({ slug: idOrSlug })) ||
      (await Product.findById(idOrSlug));

    if (!product) return res.status(404).json({ message: "Product not found" });

    const {
      name,
      price,
      discountPercent,
      sizes,
      colors,
      addOns,
      description,
      about,
      categoryId,
      isActive,
    } = req.body;

    if (name) {
      product.name = name;
      product.slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "") +
        "-" +
        Date.now();
    }

    if (price) product.price = Number(price);
    if (discountPercent !== undefined)
      product.discountPercent = Number(discountPercent);

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid categoryId" });
      }
      product.category = category._id;
    }

    if (sizes) product.sizes = parseMaybeJSON(sizes, []);
    if (colors) product.colors = parseMaybeJSON(colors, []);
    if (addOns) product.addOns = parseMaybeJSON(addOns, []);
    if (description !== undefined) product.description = description;
    if (about !== undefined) product.about = about;
    if (isActive !== undefined) product.isActive = !!isActive;

    if (req.files?.mainImage?.[0]) {
      await cloudinary.uploader.destroy(product.mainImage.publicId);
      const file = req.files.mainImage[0];
      product.mainImage = { url: file.path, publicId: file.filename };
    }

    if (req.files?.galleryImages) {
      for (let img of product.galleryImages) {
        await cloudinary.uploader.destroy(img.publicId);
      }
      const galleryFiles = req.files.galleryImages;
      product.galleryImages = galleryFiles.map((file) => ({
        url: file.path,
        publicId: file.filename,
      }));
    }

    await product.save();
    res.json({ message: "Product updated", product });
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE
export const deleteProduct = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let product =
      (await Product.findOne({ slug: idOrSlug })) ||
      (await Product.findById(idOrSlug));
    if (!product) return res.status(404).json({ message: "Product not found" });

    await cloudinary.uploader.destroy(product.mainImage.publicId);
    for (let img of product.galleryImages) {
      await cloudinary.uploader.destroy(img.publicId);
    }

    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
