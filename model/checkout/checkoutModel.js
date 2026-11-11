const mongoose = require("mongoose");

const checkoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "authentication",
      required: true,
    },

    product: {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dress",
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        default: "",
      },

      costPrice: {
        type: Number,
        required: true,
      },

      price: {
        type: Number,
        required: true,
      },

      originalPrice: {
        type: Number,
        required: true,
      },

      finalPrice: {
        type: Number,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      freeQuantity: {
        type: Number,
        default: 0,
        min: 0,
      },

      discountAmount: {
        type: Number,
        default: 0,
      },

      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "offer",
        default: null,
      },

      offerTitle: {
        type: String,
        default: null,
      },

      discountType: {
        type: String,
        enum: ["percentage", "fixed", "buy_x_get_y", null],
        default: null,
      },

      color: {
        name: {
          type: String,
          required: true,
        },

        code: {
          type: String,
          default: "#000000",
        },
      },

      size: {
        type: String,
        required: true,
      },
    },

    deliveryAddress: {
      name: {
        type: String,
        required: true,
      },

      phone: {
        type: String,
        required: true,
      },

      email: {
        type: String,
        required: true,
      },

      address: {
        type: String,
        required: true,
      },

      city: {
        type: String,
        required: true,
      },

      district: {
        type: String,
        required: true,
      },

      state: {
        type: String,
        required: true,
      },

      pincode: {
        type: String,
        required: true,
      },
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

    paymentDetails: {
      razorpayOrderId: {
        type: String,
        default: null,
      },

      razorpayPaymentId: {
        type: String,
        default: null,
      },

      razorpaySignature: {
        type: String,
        default: null,
      },
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

    subtotal: {
      type: Number,
      required: true,
    },

    totalDiscount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const checkoutModel = mongoose.model("checkout", checkoutSchema);

module.exports = checkoutModel;
