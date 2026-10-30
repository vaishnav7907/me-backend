const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed", "buy_x_get_y"],
      required: true,
    },

    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    buyQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    getQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },

    applicableTo: {
      type: String,
      enum: ["All", "Category"],
      default: "All",
    },

    category: {
      type: String,
      default: "",
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dress",
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Offer", offerSchema);
