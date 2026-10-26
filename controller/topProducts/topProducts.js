
const checkoutModel = require("../../model/checkout/checkoutModel");

const getTopProducts = async (req, res) => {
  try {
    const topProducts = await checkoutModel.aggregate([
      {
        $match: {
          orderStatus: "Delivered",
        },
      },
      {
        $lookup: {
          from: "dresses",
          localField: "product.productId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: {
          path: "$productDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          soldQuantity: {
            $convert: {
              input: "$product.quantity",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
          sellingPrice: {
            $convert: {
              input: "$product.price",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
          productCost: {
            $convert: {
              input: "$productDetails.costPrice",
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },
      {
        $addFields: {
          itemRevenue: {
            $multiply: ["$sellingPrice", "$soldQuantity"],
          },
          itemCost: {
            $multiply: ["$productCost", "$soldQuantity"],
          },
        },
      },
      {
        $group: {
          _id: "$product.productId",
          name: {
            $first: "$product.name",
          },
          category: {
            $first: "$productDetails.category",
          },
          sold: {
            $sum: "$soldQuantity",
          },
          revenue: {
            $sum: "$itemRevenue",
          },
          totalCost: {
            $sum: "$itemCost",
          },
        },
      },
      {
        $addFields: {
          profit: {
            $subtract: ["$revenue", "$totalCost"],
          },
          profitMargin: {
            $cond: [
              {
                $gt: ["$revenue", 0],
              },
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: ["$revenue", "$totalCost"],
                      },
                      "$revenue",
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          sold: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          name: 1,
          category: 1,
          sold: 1,
          revenue: {
            $round: ["$revenue", 2],
          },
          profit: {
            $round: ["$profit", 2],
          },
          profitMargin: {
            $round: ["$profitMargin", 2],
          },
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Top 10 best-selling products fetched successfully",
      topProducts,
    });
  } catch (error) {
    console.error("getTopProducts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top products",
      error: error.message,
    });
  }
};

module.exports = { getTopProducts };
