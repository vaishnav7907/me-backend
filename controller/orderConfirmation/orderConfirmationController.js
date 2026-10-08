const checkoutModel = require("../../model/checkout/checkoutModel");

const getAdminOrders = async (req, res) => {
  try {
    const orders = await checkoutModel
      .find()
      .populate("user", "FullName Email")
      .populate("product.productId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get orders",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Out for Delivery"],
      "Out for Delivery": ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    if (!allowedTransitions.hasOwnProperty(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await checkoutModel.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!allowedTransitions[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.orderStatus} to ${orderStatus}`,
      });
    }

    order.orderStatus = orderStatus;

    if (
      order.paymentMethod === "Cash on Delivery" &&
      orderStatus === "Delivered"
    ) {
      order.paymentStatus = "Paid";
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, orderStatus } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res
        .status(400)
        .json({ succes: false, message: "No orders selected" });
    }

    const allowedTransitions = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Shipped", "Cancelled"],
      Shipped: ["Out for Delivery"],
      "Out for Delivery": ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    const orders = await checkoutModel.find({ _id: { $in: orderIds } });

    const validOrdersIds = [];
    for (const order of orders) {
      if (allowedTransitions[order.orderStatus]?.includes(orderStatus)) {
        validOrdersIds.push(order._id);
      }
    }

    if (validOrdersIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No selected orders can be moved to this status",
      });
    }

    await checkoutModel.updateMany(
      { _id: { $in: validOrdersIds } },
      { $set: { orderStatus } },
    );

    if (orderStatus === "Delivered") {
      await checkoutModel.updateMany(
        {
          _id: { $in: validOrdersIds },
          paymentMethod: "Cash on Delivery",
        },
        {
          $set: { paymentStatus: "Paid" },
        },
      );
    }

    res.status(200).json({
      success: true,
      message: `${validOrdersIds.length} orders updated successfully`,
      updatedCount: validOrdersIds.length,
    });
  } catch (error) {
    console.error("Bulk update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update orders",
    });
  }
};
module.exports = { getAdminOrders, updateOrderStatus, bulkUpdateOrderStatus };
