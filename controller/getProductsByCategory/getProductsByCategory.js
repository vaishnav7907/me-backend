const dressModel = require("../../model/dress/dress");

const getShirtsByCategory = async (req, res) => {
  try {
    const {category} = req.params;

    const products = await dressModel.find({
      category: category,
      status: "Active",
    }).populate("brand");

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getShirtsByCategory };
