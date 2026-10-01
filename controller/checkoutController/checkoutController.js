const checkoutModel = require("../../model/checkout/checkoutModel");
const dressModel = require("../../model/dress/dress");
const mongoose = require("mongoose");
const createCheckout = async (req, res) => {
  try {
    const { product, deliveryAddress, paymentMethod } = req.body;

    const userId = req.user.id;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product details are required",
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const { name, phone, email, address, city, district, state, pincode } =
      deliveryAddress;

    if (
      !name ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !district ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required",
      });
    }

    if (!["Cash on Delivery", "Online Payment"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const { productId, quantity, size, color } = product;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!quantity || !size || !color?.name) {
      return res.status(400).json({
        success: false,
        message: "Product selection details are incomplete",
      });
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid positive number",
      });
    }

    const selectedQuantity = Number(quantity);

    const existingProduct = await dressModel.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const selectedVariant = existingProduct.variants.find(
      (variant) =>
        variant.color?.name?.toLowerCase() === color.name.toLowerCase(),
    );

    if (!selectedVariant) {
      return res.status(400).json({
        success: false,
        message: "Selected color is not available",
      });
    }

    const selectedSize = selectedVariant.sizes.find(
      (item) => item.size === size,
    );

    if (!selectedSize) {
      return res.status(400).json({
        success: false,
        message: "Selected size is not available",
      });
    }

    if (selectedSize.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selected size is out of stock",
      });
    }

    if (selectedQuantity > selectedSize.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${selectedSize.stock} item(s) available`,
      });
    }

    const totalAmount = Number(existingProduct.price) * selectedQuantity;

    const checkout = await checkoutModel.create({
      user: userId,

      product: {
        productId: existingProduct._id,
        name: existingProduct.name,
        image: selectedVariant.color?.mainImage?.url || "",
        price: existingProduct.price,
        quantity: selectedQuantity,

        color: {
          name: selectedVariant.color.name,
          code: selectedVariant.color.code,
        },

        size,
      },

      deliveryAddress: {
        name,
        phone,
        email,
        address,
        city,
        district,
        state,
        pincode,
      },

      paymentMethod,

      paymentStatus: "Pending",

      orderStatus: "Pending",

      totalAmount,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout created successfully",
      checkout,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports = {
  createCheckout,
};
