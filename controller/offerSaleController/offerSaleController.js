const offerModel = require("../../model/offer/offerSaleModel");

const createOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountValue,
      buyQuantity,
      getQuantity,
      startDate,
      endDate,
      status,
      applicableTo,
      category,
    } = req.body;

    if (!title || !description || !discountType || !startDate || !endDate) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (
      discountType === "percentage" &&
      (Number(discountValue) <= 0 || Number(discountValue) > 100)
    ) {
      return res.status(400).json({
        message: "Discount must be between 1 and 100",
      });
    }

    if (discountType === "fixed" && Number(discountValue) <= 0) {
      return res.status(400).json({
        message: "Discount must be greater than 0",
      });
    }

    if (
      discountType === "buy_x_get_y" &&
      (Number(buyQuantity) <= 0 || Number(getQuantity) <= 0)
    ) {
      return res.status(400).json({
        message: "Buy and get quantities must be greater than 0",
      });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        message: "End date must be after start date",
      });
    }

    if (applicableTo === "Category" && !category) {
      return res.status(400).json({
        message: "Please select a category",
      });
    }

    const offer = await offerModel.create({
      title,
      description,
      discountType,
      discountValue,
      buyQuantity,
      getQuantity,
      startDate,
      endDate,
      status,
      applicableTo,
      category,
    });

    res.status(201).json({
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const updateOfferFn = await offerModel.findByIdAndUpdate(
      id,
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updateOfferFn) {
      return res.status(404).json({
        message: "Offer not found",
      });
    }

    res.status(200).json({
      message: "Offer updated successfully",
      offer: updateOfferFn,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getOffer = async (req, res) => {
  try {
    const getOfferFn = await offerModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: getOfferFn.length,
      getOfferData: getOfferFn,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const removeOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const removeOfferFn = await offerModel.findByIdAndDelete(id);

    if (!removeOfferFn) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Offer successfully removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = { createOffer, updateOffer, getOffer, removeOffer };
