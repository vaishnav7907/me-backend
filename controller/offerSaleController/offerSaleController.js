const offerModel = require("../../model/offer/offerSaleModel");
const mongoose = require("mongoose");
const dressModel = require("../../model/dress/dress");
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
      products,
    } = req.body;

    if (!title || !description || !discountType || !startDate || !endDate) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (!["percentage", "fixed", "buy_x_get_y"].includes(discountType)) {
      return res.status(400).json({
        message: "Invalid discount type",
      });
    }

    if (!["All", "Category", "Products"].includes(applicableTo)) {
      return res.status(400).json({
        message: "Invalid applicable type",
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

    if (
      applicableTo === "Products" &&
      (!Array.isArray(products) || products.length === 0)
    ) {
      return res.status(400).json({
        message: "Please select at least one product",
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
      products: applicableTo === "Products" ? products : [],
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid offer ID",
      });
    }

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

    return res.status(200).json({
      message: "Offer updated successfully",
      offer: updateOfferFn,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

const calculateOfferPrice = (product, offers) => {
  let bestOffer = null;
  let lowestPrice = product.price;
  const currentDate = new Date();

  for (const offer of offers) {
    //  checking offer status
    if (offer.status !== "Active") {
      continue;
    }

    // Check offer start and end dates
    if (
      new Date(offer.startDate) > currentDate ||
      new Date(offer.endDate) < currentDate
    ) {
      continue;
    }

    // Check whether offer applies to this product
    let isApplicable = false;

    if (offer.applicableTo === "All") {
      isApplicable = true;
    } else if (offer.applicableTo === "Category") {
      if (offer.category?.toLowerCase() === product.category?.toLowerCase()) {
        isApplicable = true;
      }
    } else if (offer.applicableTo === "Products") {
      if (
        offer.products.some((id) => id.toString() === product._id.toString())
      ) {
        isApplicable = true;
      }
    }

    if (!isApplicable) {
      continue;
    }

    // calculate discount
    let discount = 0;

    if (offer.discountType === "percentage") {
      discount = (product.price * offer.discountValue) / 100;
    } else if (offer.discountType === "fixed") {
      discount = offer.discountValue;
    } else {
      // Buy X Get Y is handled separately in cart
      continue;
    }

    // calculate final price

    const finalPrice = Math.max(0, product.price - discount);

    // select the best offer

    if (finalPrice < lowestPrice) {
      lowestPrice = finalPrice;
      bestOffer = offer;
    }
  }

  return {
    originalPrice: product.price,
    offerPrice: Math.round(lowestPrice),
    offerApplied: bestOffer !== null,
    appliedOffer: bestOffer
      ? {
          _id: bestOffer._id,
          title: bestOffer.title,
          discountType: bestOffer.discountType,
          discountValue: bestOffer.discountValue,
        }
      : null,
  };
};

const getOffer = async (req, res) => {
  try {
    const currentDate = new Date();
    // get products
    const products = await dressModel.find().populate("brand");
    const activeOffers = await offerModel.find({
      status: "Active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Calculate offer price for every product

    const updatedProducts = products.map((product) => {
      const productData = product.toObject();
      const pricing = calculateOfferPrice(productData, activeOffers);
      return {
        ...productData,
        ...pricing,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products: updatedProducts,
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
