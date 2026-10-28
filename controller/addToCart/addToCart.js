const mongoose = require("mongoose");
const cartModel = require("../../model/cart/cartModel");
const dressModel = require("../../model/dress/dress");

const addToCartFn = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const { color, size, quantity = 1 } = req.body;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    if (!color || !size) {
      return res.status(400).json({
        message: "Color and size are required",
      });
    }

    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({
        message: "Invalid quantity",
      });
    }

    const product = await dressModel.findById(id);

    if (!product || product.status !== "Active") {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variant = product.variants.find(
      (item) => item.color.name.toLowerCase() === color.trim().toLowerCase(),
    );

    const sizeData = variant?.sizes.find(
      (item) => String(item.size).toLowerCase() === size.trim().toLowerCase(),
    );

    if (!sizeData) {
      return res.status(400).json({
        message: "Selected color or size is unavailable",
      });
    }

    const stock = Number(sizeData.stock);

    if (qty > stock) {
      return res.status(400).json({
        message: `Only ${stock} items are available`,
      });
    }

    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      cart = new cartModel({ user: userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === id &&
        item.color.toLowerCase() === color.trim().toLowerCase() &&
        item.size.toLowerCase() === size.trim().toLowerCase(),
    );

    const totalQuantity = (existingItem?.quantity || 0) + qty;

    if (totalQuantity > stock) {
      return res.status(400).json({
        message: `Only ${stock} items are available`,
      });
    }

    if (existingItem) {
      existingItem.quantity = totalQuantity;
    } else {
      cart.items.push({
        product: id,
        color: color.trim(),
        size: size.trim(),
        quantity: qty,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      message: "Product added to cart successfully",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product to cart",
      error: error.message,
    });
  }
};

const getCartItems = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Please log in first" });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const cart = await cartModel
      .findOne({ user: userId })
      .populate("items.product");

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart: cart || { user: userId, items: [] },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch cart",
      error: error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const itemId = req.params.itemId;

    if (!userId) {
      return res.status(401).json({ message: "Please log in first" });
    }

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(itemId)
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate("items.product");

    return res.status(200).json({
      message: "Product removed successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to remove product",
      error: error.message,
    });
  }
};
module.exports = { addToCartFn, getCartItems,removeFromCart };
