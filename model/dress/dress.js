const mongoose = require("mongoose");
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false },
);
const sizeSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      enum: [
        "XS",
        "S",
        "M",
        "L",
        "XL",
        "XXL",
        "28",
        "30",
        "32",
        "34",
        "36",
        "38",
        "40",
        "42",
        "44",
      ],
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false },
);
const variantSchema = new mongoose.Schema({
  color: {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, default: "#000000", trim: true },
    mainImage: { type: imageSchema, required: true },
    subImages: { type: [imageSchema], default: [] },
  },
  sizes: { type: [sizeSchema], default: [] },
});
const dressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Shirts", "Pants", "Jackets", "Innerwear", "Shorts", "T-Shirts"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    realPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Draft",
    },
    details: { type: Map, of: { type: String, trim: true }, default: {} },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true },
);
const dressModel = mongoose.model("dress", dressSchema);
module.exports = dressModel;
