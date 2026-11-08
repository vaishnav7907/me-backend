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

    // 1. Basic validation
    if (
      !title?.trim() ||
      !description?.trim() ||
      !discountType ||
      !startDate ||
      !endDate ||
      !applicableTo
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // 2. Validate status
    if (status !== undefined && !["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status",
      });
    }

    // 3. Convert products string into array
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

    // 4. Validate discount type
    if (!["percentage", "fixed", "buy_x_get_y"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const discount = Number(discountValue || 0);
    const buy = Number(buyQuantity || 0);
    const get = Number(getQuantity || 0);

    // 5. Percentage validation
    if (
      discountType === "percentage" &&
      (!Number.isFinite(discount) || discount <= 0 || discount > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage must be between 1 and 100",
      });
    }

    // 6. Fixed discount validation
    if (
      discountType === "fixed" &&
      (!Number.isFinite(discount) || discount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid fixed discount",
      });
    }

    // 7. Buy X Get Y validation
    if (
      discountType === "buy_x_get_y" &&
      (!Number.isInteger(buy) || !Number.isInteger(get) || buy <= 0 || get <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Buy and get quantities must be positive integers",
      });
    }

    // 8. Validate dates
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

    // 9. Validate applicability
    if (!["All Products", "Category", "Products"].includes(applicableTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer applicability",
      });
    }

    // 10. Validate category
    const allowedCategories = [
      "Shirts",
      "T-Shirts",
      "Pants",
      "Jackets",
      "Innerwear",
      "Shorts",
    ];

    if (applicableTo === "Category") {
      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Please select a category",
        });
      }

      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
    }

    // 11. Selected product handling
    let productPricing = [];
    let selectedProductIds = [];

    if (applicableTo === "Products") {
      if (products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one product",
        });
      }

      // Fixed discount is not supported for selected products
      if (discountType === "fixed") {
        return res.status(400).json({
          success: false,
          message: "Fixed discount is not supported for selected products",
        });
      }

      // Remove duplicate product IDs
      selectedProductIds = [...new Set(products.map(String))];

      // Validate product IDs
      if (
        selectedProductIds.some((id) => !mongoose.Types.ObjectId.isValid(id))
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID",
        });
      }

      // Fetch selected products from database
      const selectedProducts = await dressModel.find({
        _id: { $in: selectedProductIds },
      });

      if (selectedProducts.length !== selectedProductIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more selected products were not found",
        });
      }

      // Calculate final prices for percentage offers
      if (discountType === "percentage") {
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
      }
    }

    // 12. Create offer
    const createOfferFn = await offerModel.create({
      title: title.trim(),
      description: description.trim(),

      discountType,
      discountValue: discount,
      buyQuantity: buy,
      getQuantity: get,

      startDate: offerStart,
      endDate: offerEnd,

      status: status || "Inactive",

      applicableTo,

      category: applicableTo === "Category" ? category : "",

      products: applicableTo === "Products" ? selectedProductIds : [],

      productPricing,
    });

    // 13. Success response
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

module.exports = { createOffer };

const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate offer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer ID",
      });
    }

    // 2. Find existing offer
    const existingOffer = await offerModel.findById(id);

    if (!existingOffer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // 3. Get request data
    let {
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

    // 4. Basic validation
    if (
      !title?.trim() ||
      !description?.trim() ||
      !discountType ||
      !startDate ||
      !endDate ||
      !applicableTo
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // 5. Validate discount type
    const validDiscountTypes = ["percentage", "fixed", "buy_x_get_y"];

    if (!validDiscountTypes.includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    // 6. Validate applicability
    const validApplicableTo = ["All Products", "Category", "Products"];

    if (!validApplicableTo.includes(applicableTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer applicability",
      });
    }

    // 7. Validate status
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid offer status",
      });
    }

    // 8. Convert values
    const discount = Number(discountValue || 0);
    const buy = Number(buyQuantity || 0);
    const get = Number(getQuantity || 0);

    // 9. Percentage validation
    if (
      discountType === "percentage" &&
      (!Number.isFinite(discount) || discount <= 0 || discount > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage must be between 1 and 100",
      });
    }

    // 10. Fixed discount validation
    if (
      discountType === "fixed" &&
      (!Number.isFinite(discount) || discount <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Fixed discount must be greater than zero",
      });
    }

    // 11. Buy X Get Y validation
    if (
      discountType === "buy_x_get_y" &&
      (!Number.isInteger(buy) || !Number.isInteger(get) || buy <= 0 || get <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Buy and Get quantities must be positive whole numbers",
      });
    }

    // 12. Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid offer dates",
      });
    }

    // 13. Validate category
    const allowedCategories = [
      "Shirts",
      "T-Shirts",
      "Pants",
      "Jackets",
      "Innerwear",
      "Shorts",
    ];

    if (applicableTo === "Category") {
      if (!category || !allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid category",
        });
      }
    }

    // 14. Handle selected products
    let selectedProducts = [];
    let productPricing = [];

    if (applicableTo === "Products") {
      // Convert string into array if necessary
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

      if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please select at least one product",
        });
      }

      // Remove duplicate IDs
      const uniqueIds = [...new Set(products.map(String))];

      // Validate product IDs
      if (
        uniqueIds.some(
          (productId) => !mongoose.Types.ObjectId.isValid(productId),
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid selected product ID",
        });
      }

      // Fetch selected products
      const foundProducts = await dressModel
        .find({
          _id: { $in: uniqueIds },
        })
        .select("_id price");

      if (foundProducts.length !== uniqueIds.length) {
        return res.status(404).json({
          success: false,
          message: "One or more selected products were not found",
        });
      }

      selectedProducts = foundProducts.map((product) => product._id);

      // Calculate prices only for percentage offers
      if (discountType === "percentage") {
        productPricing = foundProducts.map((product) => {
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
      }
    }

    // 15. Update offer
    const updatedOffer = await offerModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            title: title.trim(),
            description: description.trim(),

            discountType,

            discountValue: discountType === "buy_x_get_y" ? 0 : discount,

            buyQuantity: discountType === "buy_x_get_y" ? buy : 0,

            getQuantity: discountType === "buy_x_get_y" ? get : 0,

            startDate: start,
            endDate: end,

            status,

            applicableTo,

            category: applicableTo === "Category" ? category : "",

            products: applicableTo === "Products" ? selectedProducts : [],

            productPricing,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .populate("products");

    // 16. Success response
    return res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Update Offer Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update offer",
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
  updateOffer,
  getOffer,
  removeOffer,
};
