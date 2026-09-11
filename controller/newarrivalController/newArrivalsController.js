const dressModel = require("../../model/dress/dress");

const getNewArrivals = async (req, res) => {
  try {
    const latestProducts = await dressModel
      .find({})
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products: latestProducts,
    });
  } catch (error) {
    console.log("GET NEW ARRIVALS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get new arrivals",
      error: error.message,
    });
  }
};

module.exports = { getNewArrivals };