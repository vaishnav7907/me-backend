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
    } = req.body;

    let { products } = req.body;

    // basic validation
    if (!title || !description || !discountType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (status !== undefined && !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status",
      });
    }
    // Convert products into array if received as JSON string

    if (typeof products === "string") {
      try {
        products = JSON.parse(products);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid products data",
        });
      }
    }

    if (products === undefined || products === null) {
      products = [];
    }

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        message: "Products must be an array",
      });
    }
    if (!["percentage", "fixed", "buy_x_get_y"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const discount = Number(discountValue || 0);
    const buy = Number(buyQuantity || 0);
    const get = Number(getQuantity || 0);

    if (discountType === "percentage" && (discount <= 0 || discount > 100)) {
      return res.status(400).json({
        success: false,
        message: "Percentage must be between 1 and 100",
      });
    }

    if (
      discountType !== "buy_x_get_y" &&
      (!Number.isFinite(discount) || discount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid discount value",
      });
    }

    if (
      discountType === "buy_x_get_y" &&
      (!Number.isInteger(buy) || !Number.isInteger(get) || buy <= 0 || get <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Buy and get quantities must be positive integers",
      });
    }

    const offerStart = new Date(startDate);
    const offerEnd = new Date(endDate);

    if (
      Number.isNaN(offerStart.getTime()) ||
      Number.isNaN(offerEnd.getTime()) ||
      offerEnd <= offerStart
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid offer dates",
      });
    }

    //  Validate applicableTo
    if (!["All Products", "Category", "Products"].includes(applicableTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer applicability",
      });
    }

    if (applicableTo === "Category" && !category) {
      return res.status(400).json({
        success: false,
        message: "Please select a category",
      });
    }

    const allowedCategories = [
      "Shirts",
      "T-Shirts",
      "Pants",
      "Jackets",
      "Innerwear",
      "Shorts",
    ];

    if (applicableTo === "Category" && !allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }
    // product pricing

    let productPricing = [];

    if (applicableTo === "Products") {
      if (products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one product",
        });
      }

      if (discountType !== "percentage") {
        return res.status(400).json({
          success: false,
          message:
            "Individual product pricing currently supports percentage offers only",
        });
      }

      // Validate product IDs

      const uniqueProducts = [...new Set(products.map(String))]; //set is used to remove duplicate. in this case it removes product ids using set
      if (uniqueProducts.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      // fetch selected products

      const selectedProducts = await dressModel.find({
        _id: { $in: uniqueProducts },
      });
      if (selectedProducts.length !== uniqueProducts.length) {
        return res.status(404).json({
          success: false,
          message: "One or more selected products were not found",
        });
      }

      // Calculate individual final prices

      productPricing = selectedProducts.map((product) => {
        const originalPrice = Number(product.price);

        const finalPrice = Number(
          (originalPrice - (originalPrice * discount) / 100).toFixed(2),
        );

        return {
          product: product._id,
          originalPrice,
          discountPercentage: discount,
          finalPrice,
        };
      });

      products = uniqueProducts;
    }

    const createOfferFn = await offerModel.create({
      title,
      description,
      discountType,
      discountValue: discount,
      buyQuantity: buy,
      getQuantity: get,
      startDate: offerStart,
      endDate: offerEnd,
      status: status || "Inactive",
      applicableTo,
      category: applicableTo === "Category" ? category : "",
      products: applicableTo === "Products" ? products : [],
      productPricing,
    });

    return res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer: createOfferFn,
    });
  } catch (error) {
    console.error("Create Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create offer",
      error: error.message,
    });
  }
};

const getOffer = async (req, res) => {
  try {
    const getOfferData = await offerModel
      .find()
      .populate({
        path: "products",
        populate: {
          path: "brand",
        },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Offers fetched successfully",
      getOfferData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE OFFER
const removeOffer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    const removedOffer = await offerModel.findByIdAndDelete(id);

    if (!removedOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Offer successfully removed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createOffer,

  getOffer,
  removeOffer,
};
