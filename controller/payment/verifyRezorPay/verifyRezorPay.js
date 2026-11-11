const crypto = require("crypto");
const razorpay = require("../../../razorpay/razorpayConfig");
const checkoutModel = require("../../../model/checkout/checkoutModel");

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      checkoutId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const userId = req.user.id;

    if (
      !checkoutId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details are missing",
      });
    }

    // 1. Find checkout belonging to this user
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

    // 2. Check Razorpay order ID from nested paymentDetails
    if (
      checkout.paymentDetails?.razorpayOrderId !== razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay order ID",
      });
    }

    // 3. Prevent verifying an already-paid checkout
    if (checkout.paymentStatus === "Paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
      });
    }

    // 4. Generate payment signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const signatureBuffer = Buffer.from(generatedSignature, "hex");
    const receivedSignatureBuffer = Buffer.from(
      razorpay_signature,
      "hex"
    );

    if (
      signatureBuffer.length !== receivedSignatureBuffer.length ||
      !crypto.timingSafeEqual(
        signatureBuffer,
        receivedSignatureBuffer
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // 5. Fetch payment details directly from Razorpay
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== Math.round(Number(checkout.totalAmount) * 100) ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment amount or status is invalid",
      });
    }

    // 6. Update checkout payment details
    checkout.paymentStatus = "Paid";
    checkout.orderStatus = "Confirmed";

    checkout.paymentDetails.razorpayPaymentId =
      razorpay_payment_id;

    checkout.paymentDetails.razorpaySignature =
      razorpay_signature;

    await checkout.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      checkout,
    });
  } catch (error) {
    console.error("Razorpay Verification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment verification error",
    });
  }
};

module.exports = {
  verifyRazorpayPayment,
};