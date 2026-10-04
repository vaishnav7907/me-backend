const razorpay = require("../../../razorpay/razorpayConfig");

const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `ME_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

module.exports = { createRazorpayOrder };
