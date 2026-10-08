const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Authentication",
      required: true,
    },

    product: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dress",
        required: true,
      },

      name: { type: String, required: true, trim: true },
      image: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      
      quantity: { type: Number, required: true, min: 1 },
      color: {
        name: { type: String, required: true },
        code: { type: String, required: true },
      },
      size: { type: String, required: true },
    },

    deliveryAddress: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },

    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Online Payment"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentId: { type: String, default: null },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const checkoutSchemaModel = mongoose.model("checkout", checkoutSchema);

module.exports = checkoutSchemaModel;
