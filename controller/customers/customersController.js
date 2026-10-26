const authModel = require("../../model/authentication/authentication");
const getAuthenticatedUsers = async (req, res) => {
  try {
    const userWithOrders = await authModel.aggregate([
      {
        $match: {
          role: "user",
        },
      },
      {
        $lookup: {
          from: "checkouts",
          let: {
            customerId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$user", "$$customerId"],
                },
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
          ],
          as: "orders",
        },
      },
      {
        $addFields: {
          totalOrders: {
            $size: "$orders",
          },
          totalSpent: {
            $sum: {
              $map: {
                input: "$orders",
                as: "order",
                in: {
                  $cond: [
                    {
                      $eq: ["$$order.orderStatus", "Delivered"],
                    },
                    {
                      $ifNull: ["$$order.totalAmount", 0],
                    },
                    0,
                  ],
                },
              },
            },
          },
          lastOrderDate: {
            $ifNull: [
              {
                $arrayElemAt: ["$orders.createdAt", 0],
              },
              null,
            ],
          },
        },
      },
      {
        $project: {
          Password: 0,
          password: 0,
          __v: 0,
          "orders.user": 0,
        },
      },
      {
        $sort: {
          lastOrderDate: -1,
          createdAt: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count: userWithOrders.length,
      getAuthData: userWithOrders,
    });
  } catch (error) {
    console.log("error in get auth users", error);
    return res.status(500).json({
      message: "error in get authenticated users",
      error: error.message,
    });
  }
};

const getUsersByAge = async (req, res) => {
  try {
    const getUsersByAgeAndOtherDetails = await authModel.aggregate([
      {
        $match: {
          role: "user",
        },
      },
      {
        $addFields: {
          customerAge: {
            $convert: {
              input: "$Age",
              to: "int",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $match: {
          customerAge: { $gte: 18 },
        },
      },
      {
        $lookup: {
          from: "checkouts",
          let: {
            customerId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$user", "$$customerId"],
                },
              },
            },
            {
              $addFields: {
                isDelivered: {
                  $eq: ["$orderStatus", "Delivered"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalOrders: {
                  $sum: 1,
                },
                deliveredOrders: {
                  $sum: {
                    $cond: ["$isDelivered", 1, 0],
                  },
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      "$isDelivered",
                      { $ifNull: ["$totalAmount", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: "orderSummary",
        },
      },
      {
        $addFields: {
          orderSummary: {
            $ifNull: [
              { $arrayElemAt: ["$orderSummary", 0] },
              {
                totalOrders: 0,
                deliveredOrders: 0,
                totalRevenue: 0,
              },
            ],
          },
        },
      },
      {
        $addFields: {
          ageGroup: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $gte: ["$customerAge", 18] },
                      { $lte: ["$customerAge", 24] },
                    ],
                  },
                  then: "18–24",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$customerAge", 25] },
                      { $lte: ["$customerAge", 34] },
                    ],
                  },
                  then: "25–34",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$customerAge", 35] },
                      { $lte: ["$customerAge", 44] },
                    ],
                  },
                  then: "35–44",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$customerAge", 45] },
                      { $lte: ["$customerAge", 54] },
                    ],
                  },
                  then: "45–54",
                },
              ],
              default: "55+",
            },
          },
          groupOrder: {
            $switch: {
              branches: [
                {
                  case: { $lte: ["$customerAge", 24] },
                  then: 1,
                },
                {
                  case: { $lte: ["$customerAge", 34] },
                  then: 2,
                },
                {
                  case: { $lte: ["$customerAge", 44] },
                  then: 3,
                },
                {
                  case: { $lte: ["$customerAge", 54] },
                  then: 4,
                },
              ],
              default: 5,
            },
          },
          totalOrders: "$orderSummary.totalOrders",
          deliveredOrders: "$orderSummary.deliveredOrders",
          totalRevenue: "$orderSummary.totalRevenue",
        },
      },
      {
        $group: {
          _id: "$ageGroup",
          groupOrder: { $first: "$groupOrder" },
          customers: { $sum: 1 },
          orders: { $sum: "$totalOrders" },
          deliveredOrders: { $sum: "$deliveredOrders" },
          revenue: { $sum: "$totalRevenue" },
        },
      },
      {
        $addFields: {
          averageOrder: {
            $cond: [
              { $gt: ["$deliveredOrders", 0] },
              {
                $divide: ["$revenue", "$deliveredOrders"],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          groupOrder: 1,
        },
      },
      {
        $project: {
          _id: 0,
          id: "$groupOrder",
          age: "$_id",
          customers: 1,
          orders: 1,
          deliveredOrders: 1,
          revenue: { $round: ["$revenue", 2] },
          averageOrder: { $round: ["$averageOrder", 2] },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Customer age analytics fetched successfully",
      getUsersByAgeAndOtherDetails,
    });
  } catch (error) {
    console.error("getUsersByAge error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer age analytics",
      error: error.message,
    });
  }
};

module.exports = { getAuthenticatedUsers, getUsersByAge };
