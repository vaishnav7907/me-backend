const checkoutModel = require("../../model/checkout/checkoutModel");
const dressModel = require("../../model/dress/dress");
const authModel = require("../../model/authentication/authentication");
const offerModel = require("../../model/offer/offerSaleModel");
const mongoose = require("mongoose");

const createCheckout = async (req, res) => {
  let session;

  try {
    const { product, deliveryAddress, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product details are required",
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    const { name, phone, email, address, city, district, state, pincode } =
      deliveryAddress;

    if (
      !name ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !district ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete delivery address is required",
      });
    }

    if (!["Cash on Delivery", "Online Payment"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    // Verify user
    const existingUser = await authModel.findById(userId);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (existingUser.Email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email doesn't match the logged-in user",
      });
    }

    // Validate product selection
    const { productId, quantity, size, color } = product;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!size || !color?.name) {
      return res.status(400).json({
        success: false,
        message: "Product selection details are incomplete",
      });
    }

    const selectedQuantity = Number(quantity);

    if (!Number.isInteger(selectedQuantity) || selectedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid positive number",
      });
    }

    // Fetch product
    const existingProduct = await dressModel.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const selectedVariant = existingProduct.variants.find(
      (variant) =>
        variant.color?.name?.toLowerCase() === color.name.toLowerCase(),
    );

    if (!selectedVariant) {
      return res.status(400).json({
        success: false,
        message: "Selected color is not available",
      });
    }

    const selectedSize = selectedVariant.sizes.find(
      (item) => item.size === size,
    );

    if (!selectedSize) {
      return res.status(400).json({
        success: false,
        message: "Selected size is not available",
      });
    }

    // Get original product price
    const originalPrice = Number(existingProduct.price);

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    // Fetch valid offers
    const currentDate = new Date();

    const activeOffers = await offerModel.find({
      status: "Active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Find offers applicable to this product
    const applicableOffers = activeOffers.filter((offer) => {
      if (offer.applicableTo === "All Products") {
        return true;
      }

      if (offer.applicableTo === "Category") {
        return (
          offer.category?.toLowerCase() ===
          existingProduct.category?.toLowerCase()
        );
      }

      if (offer.applicableTo === "Products") {
        return offer.products.some(
          (id) => id.toString() === existingProduct._id.toString(),
        );
      }

      return false;
    });

    // Calculate the best offer
    let bestOffer = null;
    let bestDiscount = 0;
    let freeQuantity = 0;
    let finalPrice = originalPrice;

    for (const offer of applicableOffers) {
      let currentDiscount = 0;
      let currentFreeQuantity = 0;

      // Percentage discount
      if (offer.discountType === "percentage") {
        let percentage = Number(offer.discountValue);

        if (offer.applicableTo === "Products") {
          const productPricing = offer.productPricing.find(
            (item) =>
              item.product.toString() === existingProduct._id.toString(),
          );

          if (!productPricing) {
            continue;
          }

          percentage = Number(productPricing.discountPercentage);
        }

        if (
          !Number.isFinite(percentage) ||
          percentage <= 0 ||
          percentage > 100
        ) {
          continue;
        }

        currentDiscount =
          ((originalPrice * percentage) / 100) * selectedQuantity;
      }

      // Fixed discount
      else if (offer.discountType === "fixed") {
        const fixedDiscount = Number(offer.discountValue);

        if (!Number.isFinite(fixedDiscount) || fixedDiscount <= 0) {
          continue;
        }

        currentDiscount =
          Math.min(fixedDiscount, originalPrice) * selectedQuantity;
      }

      // Buy X Get Y
      else if (offer.discountType === "buy_x_get_y") {
        const buyQuantity = Number(offer.buyQuantity);
        const getQuantity = Number(offer.getQuantity);

        if (
          !Number.isInteger(buyQuantity) ||
          !Number.isInteger(getQuantity) ||
          buyQuantity <= 0 ||
          getQuantity <= 0
        ) {
          continue;
        }

        currentFreeQuantity =
          Math.floor(selectedQuantity / buyQuantity) * getQuantity;

        currentDiscount = currentFreeQuantity * originalPrice;
      }

      // Select offer with highest customer discount
      if (currentDiscount > bestDiscount) {
        bestDiscount = currentDiscount;
        bestOffer = offer;
        freeQuantity = currentFreeQuantity;
      }
    }

    // Calculate final order amount
    const subtotal = Number((originalPrice * selectedQuantity).toFixed(2));

    const totalDiscount = Number(bestDiscount.toFixed(2));

    let totalAmount = subtotal;

    if (
      bestOffer?.discountType === "percentage" ||
      bestOffer?.discountType === "fixed"
    ) {
      totalAmount = subtotal - totalDiscount;
    }

    totalAmount = Number(Math.max(0, totalAmount).toFixed(2));

    if (
      bestOffer?.discountType === "percentage" ||
      bestOffer?.discountType === "fixed"
    ) {
      finalPrice = Number(
        (originalPrice - totalDiscount / selectedQuantity).toFixed(2),
      );
    }

    // Check stock including free items
    const totalRequiredStock = selectedQuantity + freeQuantity;

    if (selectedSize.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selected size is out of stock",
      });
    }

    if (totalRequiredStock > selectedSize.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${selectedSize.stock} item(s) available, including free items`,
      });
    }

    // Start transaction
    session = await mongoose.startSession();
    session.startTransaction();

    // Atomic stock deduction
    const automaticDeductionOfProducts = await dressModel.findOneAndUpdate(
      {
        _id: productId,
        variants: {
          $elemMatch: {
            "color.name": color.name,
            sizes: {
              $elemMatch: {
                size: size,
                stock: { $gte: totalRequiredStock },
              },
            },
          },
        },
      },
      {
        $inc: {
          "variants.$[variant].sizes.$[size].stock": -totalRequiredStock,
        },
      },
      {
        arrayFilters: [
          { "variant.color.name": color.name },
          {
            "size.size": size,
            "size.stock": { $gte: totalRequiredStock },
          },
        ],
        new: true,
        session,
      },
    );

    if (!automaticDeductionOfProducts) {
      throw new Error("Insufficient stock");
    }

    // Create checkout
    const [checkout] = await checkoutModel.create(
      [
        {
          user: userId,

          product: {
            productId: existingProduct._id,
            name: existingProduct.name,
            image: selectedVariant.color?.mainImage?.url || "",
            costPrice: existingProduct.costPrice,
            price: originalPrice,
            originalPrice,
            finalPrice,
            quantity: selectedQuantity,
            freeQuantity,
            discountAmount: totalDiscount,
            offerId: bestOffer?._id || null,
            offerTitle: bestOffer?.title || null,
            discountType: bestOffer?.discountType || null,

            color: {
              name: selectedVariant.color.name,
              code: selectedVariant.color.code,
            },

            size,
          },

          deliveryAddress: {
            name,
            phone,
            email,
            address,
            city,
            district,
            state,
            pincode,
          },

          paymentMethod,
          paymentStatus: "Pending",
          orderStatus: "Pending",
          subtotal,
          totalDiscount,
          totalAmount,
        },
      ],
      { session },
    );

    // Commit transaction
    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message: "Checkout created successfully",

      checkout,

      offerDetails: {
        title: bestOffer?.title || null,
        discountType: bestOffer?.discountType || null,
        freeQuantity,
        purchasedQuantity: selectedQuantity,
        totalQuantity: selectedQuantity + freeQuantity,
      },
    });
  } catch (error) {
    if (session?.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Checkout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const previewCheckoutOffer = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const selectedQuantity = Number(quantity);

    if (!Number.isInteger(selectedQuantity) || selectedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });
    }

    const existingProduct = await dressModel.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const originalPrice = Number(existingProduct.price);

    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }

    const currentDate = new Date();

    const activeOffers = await offerModel.find({
      status: "Active",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const applicableOffers = activeOffers.filter((offer) => {
      if (offer.applicableTo === "All Products") {
        return true;
      }

      if (offer.applicableTo === "Category") {
        return (
          offer.category?.toString().toLowerCase() ===
          existingProduct.category?.toString().toLowerCase()
        );
      }

      if (offer.applicableTo === "Products") {
        return offer.products?.some(
          (id) => id.toString() === existingProduct._id.toString()
        );
      }

      return false;
    });

    let bestOffer = null;
    let bestDiscount = 0;
    let freeQuantity = 0;

    for (const offer of applicableOffers) {
      let currentDiscount = 0;
      let currentFreeQuantity = 0;

      if (offer.discountType === "percentage") {
        let percentage = Number(offer.discountValue);

        if (offer.applicableTo === "Products") {
          const productPricing = offer.productPricing?.find(
            (item) =>
              item.product.toString() === existingProduct._id.toString()
          );

          if (!productPricing) continue;

          percentage = Number(productPricing.discountPercentage);
        }

        if (
          !Number.isFinite(percentage) ||
          percentage <= 0 ||
          percentage > 100
        ) {
          continue;
        }

        currentDiscount =
          ((originalPrice * percentage) / 100) * selectedQuantity;
      } else if (offer.discountType === "fixed") {
        const fixedDiscount = Number(offer.discountValue);

        if (!Number.isFinite(fixedDiscount) || fixedDiscount <= 0) {
          continue;
        }

        currentDiscount =
          Math.min(fixedDiscount, originalPrice) * selectedQuantity;
      } else if (offer.discountType === "buy_x_get_y") {
        const buyQuantity = Number(offer.buyQuantity);
        const getQuantity = Number(offer.getQuantity);

        if (
          !Number.isInteger(buyQuantity) ||
          !Number.isInteger(getQuantity) ||
          buyQuantity <= 0 ||
          getQuantity <= 0
        ) {
          continue;
        }

        currentFreeQuantity =
          Math.floor(selectedQuantity / buyQuantity) * getQuantity;

        currentDiscount = currentFreeQuantity * originalPrice;
      }

      if (currentDiscount > bestDiscount) {
        bestDiscount = currentDiscount;
        bestOffer = offer;
        freeQuantity = currentFreeQuantity;
      }
    }

    const subtotal = originalPrice * selectedQuantity;

    let totalAmount = subtotal;

    if (
      bestOffer &&
      (bestOffer.discountType === "percentage" ||
        bestOffer.discountType === "fixed")
    ) {
      totalAmount = Math.max(0, subtotal - bestDiscount);
    }

    return res.status(200).json({
      success: true,
      message: "Offer preview calculated successfully",
      offerDetails: {
        offerApplied: Boolean(bestOffer),
        title: bestOffer?.title || null,
        discountType: bestOffer?.discountType || null,
        discountAmount: bestDiscount,
        discountPercentage:
          bestOffer?.discountType === "percentage"
            ? bestOffer.applicableTo === "Products"
              ? Number(
                  bestOffer.productPricing?.find(
                    (item) =>
                      item.product.toString() ===
                      existingProduct._id.toString()
                  )?.discountPercentage || 0
                )
              : Number(bestOffer.discountValue)
            : null,
        buyQuantity:
          bestOffer?.discountType === "buy_x_get_y"
            ? bestOffer.buyQuantity
            : null,
        getQuantity:
          bestOffer?.discountType === "buy_x_get_y"
            ? bestOffer.getQuantity
            : null,
        purchasedQuantity: selectedQuantity,
        freeQuantity,
        totalQuantity: selectedQuantity + freeQuantity,
      },
      priceDetails: {
        originalPrice,
        subtotal,
        totalDiscount: bestDiscount,
        totalAmount,
      },
    });
  } catch (error) {
    console.error("Error in previewCheckoutOffer:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports = {
  createCheckout,
  previewCheckoutOffer
};
