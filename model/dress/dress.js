const mongoose = require("mongoose");

const dressSchema = new mongoose.Schema(
  {
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

    price: {
      type: Number,
      required: true,
    },

    realPrice: {
      type: Number,
      required: true,
    },

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

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brand",
    },

   

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
          },
        },

        images: [
          {
            type: String,
          },
        ],

        sizes: [
          {
            size: {
              type: String,
              enum: ["XS", "S", "M", "L", "XL", "XXL"],
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
