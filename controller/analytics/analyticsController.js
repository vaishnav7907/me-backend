const checkoutModel = require("../../model/checkout/checkoutModel");
const getAdminAnalytics = async (req, res) => {
  const TIME_ZONE = "Asia/Kolkata";
  const IST_OFFSET = 330 * 60 * 1000;
  try {
    const { period = "monthly" } = req.query;
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "numeric",
    }).formatToParts(now);

    const currentYear = Number(
      parts.find((part) => part.type === "year").value,
    );

    const currentMonth = Number(
      parts.find((part) => part.type === "month").value,
    );

    const year = Number(req.query.year || currentYear);
    const month = Number(req.query.month || currentMonth);

    if (!["daily", "monthly", "yearly"].includes(period)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analytics period",
      });
    }

    if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
      return res.status(400).json({
        success: false,
        message: "Invalid year",
      });
    }

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      (year === currentYear && month > currentMonth)
    ) {
      return res.status(400).json({
        success: false,
        message: "invalid month",
      });
    }

    const istTimeBoundary = (y, m, d = 1) => {
      return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET);
    };

    let startDate;
    let endDate;

    if (period === "daily") {
      startDate = istTimeBoundary(year, month);
      endDate = istTimeBoundary(year, month + 1);
    } else if (period === "monthly") {
      startDate = istTimeBoundary(year, 1);
      endDate = istTimeBoundary(year + 1, 1);
    } else {
      startDate = istTimeBoundary(2000, 1);
      endDate = istTimeBoundary(year + 1, 1);
    }

    const dateFormat = {
      daily: "%Y-%m-%d",
      monthly: "%Y-%m",
      yearly: "%Y",
    };

    const companyCalculations = await checkoutModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",

          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },

      {
        $addFields: {
          hasCostPrice: {
            $and: [
              { $isNumber: "$product.costPrice" },
              { $gt: ["$product.costPrice", 0] },
            ],
          },

          orderCost: {
            $multiply: [
              { $ifNull: ["$product.costPrice", 0] },
              { $ifNull: ["$product.quantity", 0] },
            ],
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat[period],
              date: "$createdAt",
              timezone: TIME_ZONE,
            },
          },
          revenue: {
            $sum: { $ifNull: ["$totalAmount", 0] },
          },
          totalCost: {
            $sum: "$orderCost",
          },
          orderCount: {
            $sum: 1,
          },
          ordersWithCost: {
            $sum: {
              $cond: ["$hasCostPrice", 1, 0],
            },
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    let labels = [];

    if (period === "daily") {
      const daysInMonth = new Date(year, month, 0).getDate();
      labels = Array.from(
        { length: daysInMonth },
        (_, index) =>
          `${year}-${String(month).padStart(2, "0")}-${String(
            index + 1,
          ).padStart(2, "0")}`,
      );
    }

    if (period === "monthly") {
      labels = Array.from(
        { length: 12 },
        (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`,
      );
    }

    if (period === "yearly") {
      const firstYear =
        companyCalculations.length > 0
          ? Math.min(...companyCalculations.map((item) => Number(item._id)))
          : year;

      labels = Array.from({ length: year - firstYear + 1 }, (_, index) =>
        String(firstYear + index),
      );
    }

    const resultMap = new Map(
      companyCalculations.map((item) => [item._id, item]),
    );

    const analytics = labels.map((label) => {
      const item = resultMap.get(label);
      const hasCompleteCosts = item && item.ordersWithCost === item.orderCount;

      return {
        label,
        revenue: item?.revenue ?? 0,
        profit: hasCompleteCosts ? item.revenue - item.totalCost : null,
        orderCount: item?.orderCount ?? 0,
      };
    });

    const totalRevenue = analytics.reduce(
      (total, item) => total + item.revenue,
      0,
    );

    const totalOrders = analytics.reduce(
      (total, item) => total + item.orderCount,
      0,
    );

    const profitAvailable = companyCalculations.every(
      (item) => item.ordersWithCost === item.orderCount,
    );

    const totalProfit = profitAvailable
      ? companyCalculations.reduce(
          (total, item) => total + item.revenue - item.totalCost,
          0,
        )
      : null;

    return res.status(200).json({
      success: true,

      period,
      year,
      ...(period === "daily" ? { month } : {}),
      analytics,
      summary: {
        totalRevenue,
        totalProfit,
        totalOrders,
        profitAvailable,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};
module.exports = { getAdminAnalytics };
