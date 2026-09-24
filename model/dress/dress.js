const mongoose = require("mongoose");

const dressSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

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

    // =========================
    // PRICING
    // =========================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    realPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // =========================
    // STOCK
    // =========================

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // PRODUCT IDENTIFICATION
    // =========================

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    // =========================
    // STATUS
    // =========================

    status: {
      type: String,
      enum: ["Active", "Inactive", "Draft"],
      default: "Draft",
    },

    // =========================
    // PRODUCT DETAILS
    // =========================

    details: {
      type: Map,
      of: { type: String, trim: true },
      default: {},
    },

    // =========================
    // PRODUCT VARIANTS
    // =========================

    variants: [
      {
        color: {
          name: {
            type: String,
            required: true,
            trim: true,
          },

          code: {
            type: String,
            required: true,
            trim: true,
            default: "#000000",
          },
        },

        images: [
          {
            url: {
              type: String,
              required: true,
            },

            publicId: {
              type: String,
              required: true,
            },
          },
        ],

        sizes: [
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

            stock: {
              type: Number,
              default: 0,
              min: 0,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
);

const dressModel = mongoose.model("dress", dressSchema);

module.exports = dressModel;
