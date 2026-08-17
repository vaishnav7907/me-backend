const mongoose = require("mongoose");

const dressShema = new mongoose.Schema(
  {
    Name: { type: String, required: true},
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
    brandName: { type: mongoose.Schema.ObjectId, ref: "brand" },
    brandIcon: { type: mongoose.Schema.ObjectId, ref: "brand" },
    variants: [
      {
        color: {
          name: { type: String, required: true },
          code: { type: String, required: true },
        },

        images: [{ type: String,  default: "" }],
        sizes: [
          {
            size: { type: String, enum: ["XS", "S", "M", "L", "XL", "XXL"] },
            stock: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const dressmodel = mongoose.model("dress", dressShema);
module.exports = dressmodel;
