const razorpay = require("../../../razorpay/razorpayConfig");
const checkoutModel = require("../../../model/checkout/checkoutModel");

const createRazorpayOrder = async (req, res) => {
  try {
    const { checkoutId } = req.body;
    const userId = req.user.id;

    if (!checkoutId) {
      return res.status(400).json({
        success: false,
        message: "Checkout ID is required",
      });
    }

    const checkout = await checkoutModel.findOne({
      _id: checkoutId,
      user: userId,
    });

    if (!checkout) {
      return res.status(404).json({
        success: false,
        message: "Checkout not found",
      });
    }

    if (checkout.paymentMethod !== "Online Payment") {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    if (checkout.paymentStatus !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Checkout is not pending",
      });
    }

    const amount = Number(checkout.totalAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid checkout amount",
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `ME_${checkout._id}`,
    };

    const order = await razorpay.orders.create(options);

    // Save Razorpay order ID inside paymentDetails
    checkout.paymentDetails = checkout.paymentDetails || {};

    checkout.paymentDetails.razorpayOrderId = order.id;

    await checkout.save();

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

module.exports = { createRazorpayOrder };