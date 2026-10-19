
const authModel= require("../../model/authentication/authentication")
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

module.exports={getAuthenticatedUsers}