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
              {
                $add: [
                  { $ifNull: ["$product.quantity", 0] },
                  { $ifNull: ["$product.freeQuantity", 0] },
                ],
              },
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

// month profit or loss

const IST_OFFSET = 330 * 60 * 1000;

const getmonthRange = (year, month) => ({
  start: new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET),
  end: new Date(Date.UTC(year, month, 1) - IST_OFFSET),
});

const calculateMonth = async (start, end) => {
  const monthResult = await checkoutModel.aggregate([
    {
      $match: {
        orderStatus: "Delivered",
        createdAt: {
          $gte: start,
          $lt: end,
        },
      },
    },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: { $ifNull: ["$totalAmount", 0] },
        },
        productCost: {
          $sum: {
            $multiply: [
              { $ifNull: ["$product.costPrice", 0] },
              {
                $add: [
                  { $ifNull: ["$product.quantity", 0] },
                  { $ifNull: ["$product.freeQuantity", 0] },
                ],
              },
            ],
          },
        },
        totalOrders: { $sum: 1 },
        missingCostPriceOrders: {
          $sum: {
            $cond: [
              {
                $not: [
                  {
                    $and: [
                      { $isNumber: "$product.costPrice" },
                      { $gt: ["$product.costPrice", 0] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const data = monthResult[0] || {
    revenue: 0,
    productCost: 0,
    totalOrders: 0,
    missingCostPriceOrders: 0,
  };

  const profitOrLoss = data.revenue - data.productCost;
  const profitAvailable = data.missingCostPriceOrders === 0;
  return {
    revenue: data.revenue,
    productCost: data.productCost,

    profit: profitAvailable ? Math.max(profitOrLoss, 0) : null,
    loss: profitAvailable ? Math.max(-profitOrLoss, 0) : null,
    profitOrLoss: profitAvailable ? profitOrLoss : null,

    totalOrders: data.totalOrders,
    missingCostPriceOrders: data.missingCostPriceOrders,
    profitAvailable,

    profitMargin:
      profitAvailable && data.revenue > 0
        ? Number(((profitOrLoss / data.revenue) * 100).toFixed(2))
        : null,
  };
};

const previousMonthAnalysis = async (req, res) => {
  const TIMEZONE = "Asia/Kolkata";
  try {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "numeric",
    }).formatToParts(now);

    const year = Number(parts.find((part) => part.type === "year").value);
    const month = Number(parts.find((part) => part.type === "month").value);

    const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));

    const previousYear = prevMonthDate.getUTCFullYear();
    const previousMonth = prevMonthDate.getUTCMonth() + 1;
    const previousRange = getmonthRange(previousYear, previousMonth);
    const currentRange = getmonthRange(year, month);
    const [previous, current] = await Promise.all([
      calculateMonth(previousRange.start, previousRange.end),
      calculateMonth(currentRange.start, currentRange.end),
    ]);

    return res.status(200).json({
      success: true,
      previousMonth: {
        month: new Date(
          Date.UTC(previousYear, previousMonth - 1, 1),
        ).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }),
        ...previous,
      },
      comparison: {
        revenueChange: current.revenue - previous.revenue,
        profitOrLossChange:
          current.profitAvailable && previous.profitAvailable
            ? current.profitOrLoss - previous.profitOrLoss
            : null,
      },
    });
  } catch (error) {
    console.error("Previous month analysis error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate previous month analysis",
    });
  }
};

const BUSINESS_START_YEAR = 2002;

const getCompleteBusinessAnalysis = async (req, res) => {
  try {
    const currentYear = Number(
      new Intl.DateTimeFormat("en", {
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date()),
    );

    const completeOrders = await checkoutModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
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
          orderRevenue: {
            $ifNull: ["$totalAmount", 0],
          },
          orderCost: {
            $multiply: [
              { $ifNull: ["$product.costPrice", 0] },
              {
                $add: [
                  { $ifNull: ["$product.quantity", 0] },
                  { $ifNull: ["$product.freeQuantity", 0] },
                ],
              },
            ],
          },
          orderQuantity: {
            $add: [
              { $ifNull: ["$product.quantity", 0] },
              { $ifNull: ["$product.freeQuantity", 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          orderProfit: {
            $subtract: ["$orderRevenue", "$orderCost"],
          },
          orderLoss: {
            $max: [
              0,
              {
                $subtract: ["$orderCost", "$orderRevenue"],
              },
            ],
          },
        },
      },

      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                lifetimeRevenue: {
                  $sum: "$orderRevenue",
                },
                lifetimeCost: {
                  $sum: "$orderCost",
                },
                lifetimeProfit: {
                  $sum: "$orderProfit",
                },
                lifetimeLoss: {
                  $sum: "$orderLoss",
                },
                totalOrders: {
                  $sum: 1,
                },
                ordersWithCost: {
                  $sum: {
                    $cond: ["$hasCostPrice", 1, 0],
                  },
                },
                productsSold: {
                  $sum: "$orderQuantity",
                },
                customers: {
                  $addToSet: "$user",
                },
              },
            },
            {
              $project: {
                _id: 0,
                lifetimeRevenue: 1,
                lifetimeCost: 1,
                lifetimeProfit: 1,
                lifetimeLoss: 1,
                totalOrders: 1,
                ordersWithCost: 1,
                productsSold: 1,
                customers: {
                  $size: "$customers",
                },
              },
            },
          ],

          yearlyData: [
            {
              $group: {
                _id: {
                  $year: {
                    date: "$createdAt",
                    timezone: "Asia/Kolkata",
                  },
                },
                revenue: {
                  $sum: "$orderRevenue",
                },
                profit: {
                  $sum: "$orderProfit",
                },
                loss: {
                  $sum: "$orderLoss",
                },
                orders: {
                  $sum: 1,
                },
                ordersWithCost: {
                  $sum: {
                    $cond: ["$hasCostPrice", 1, 0],
                  },
                },
                productsSold: {
                  $sum: "$orderQuantity",
                },
                customers: {
                  $addToSet: "$user",
                },
              },
            },
            {
              $project: {
                _id: 0,
                year: "$_id",
                revenue: 1,
                profit: 1,
                loss: 1,
                orders: 1,
                ordersWithCost: 1,
                productsSold: 1,
                customers: {
                  $size: "$customers",
                },
              },
            },
            {
              $sort: {
                year: 1,
              },
            },
          ],

          yearlyProfit: [
            {
              $group: {
                _id: {
                  $year: {
                    date: "$createdAt",
                    timezone: "Asia/Kolkata",
                  },
                },
                profit: {
                  $sum: "$orderProfit",
                },
                orders: {
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
              $match: {
                $expr: {
                  $eq: ["$ordersWithCost", "$orders"],
                },
              },
            },
            {
              $sort: {
                profit: -1,
                _id: 1,
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
    ]);

    const result = completeOrders[0];

    const summary = result?.summary?.[0] || {
      lifetimeRevenue: 0,
      lifetimeCost: 0,
      lifetimeProfit: 0,
      lifetimeLoss: 0,
      totalOrders: 0,
      ordersWithCost: 0,
      productsSold: 0,
      customers: 0,
    };

    const profitAvailable = summary.ordersWithCost === summary.totalOrders;

    const revenue = summary.lifetimeRevenue;

    const profit = profitAvailable ? summary.lifetimeProfit : null;

    const lifetimeLoss = profitAvailable ? summary.lifetimeLoss : null;

    const lifetimeCost = profitAvailable ? summary.lifetimeCost : null;

    res.status(200).json({
      success: true,
      businessSince: BUSINESS_START_YEAR,
      currentYear,

      lifetimeRevenue: revenue,
      lifetimeCost,
      lifetimeProfit: profit,
      lifetimeLoss,

      profitAvailable,
      missingCostPriceOrders: summary.totalOrders - summary.ordersWithCost,

      totalOrders: summary.totalOrders,
      productsSold: summary.productsSold,
      customers: summary.customers,

      profitMargin:
        profitAvailable && revenue > 0
          ? Number(((profit / revenue) * 100).toFixed(2))
          : null,

      lossRatio:
        profitAvailable && revenue > 0
          ? Number(((lifetimeLoss / revenue) * 100).toFixed(2))
          : null,

      averageOrder:
        summary.totalOrders > 0
          ? Number((revenue / summary.totalOrders).toFixed(2))
          : 0,

      yearlyData: (result?.yearlyData || []).map((item) => {
        const yearProfitAvailable = item.ordersWithCost === item.orders;

        return {
          ...item,
          profitAvailable: yearProfitAvailable,
          profit: yearProfitAvailable ? item.profit : null,
          loss: yearProfitAvailable ? item.loss : null,
        };
      }),

      bestProfitYear: result?.yearlyProfit?.[0]
        ? {
            year: result.yearlyProfit[0]._id,
            profit: result.yearlyProfit[0].profit,
          }
        : {
            year: null,
            profit: null,
          },
    });
  } catch (error) {
    console.error("Complete business analysis error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch complete business analysis",
    });
  }
};

module.exports = {
  getAdminAnalytics,
  previousMonthAnalysis,
  getCompleteBusinessAnalysis,
};
