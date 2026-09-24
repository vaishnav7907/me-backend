const dressModel = require("../../model/dress/dress");
const brandModel = require("../../model/brand/brand");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const sharp = require("sharp");
const streamFier = require("streamifier");
const mongoose = require("mongoose");
///create dress //////////////////////
const createDress = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);

    const {
      name,
      description,
      category,
      price,
      realPrice,
      brand,
      details,
      variants,
      sku,
      status,
      discount,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Brand is required",
      });
    }

    if (!variants) {
      return res.status(400).json({
        success: false,
        message: "Variants are required",
      });
    }

    const existBrand = await brandModel.findById(brand);

    if (!existBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // =========================
    // PARSE VARIANTS
    // =========================

    let parsedVariants;

    try {
      parsedVariants =
        typeof variants === "string" ? JSON.parse(variants) : variants;

      if (!Array.isArray(parsedVariants)) {
        return res.status(400).json({
          success: false,
          message: "Variants must be an array",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid variants format",
      });
    }

    // =========================
    // PARSE DETAILS
    // =========================

    let parsedDetails = {};

    if (details) {
      try {
        parsedDetails =
          typeof details === "string" ? JSON.parse(details) : details;

        if (typeof parsedDetails !== "object" || Array.isArray(parsedDetails)) {
          return res.status(400).json({
            success: false,
            message: "Details must be an object",
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid details format",
        });
      }
    }

    // =========================
    // UPLOAD IMAGES
    // =========================

    const uploadedImage = [];

    for (const file of req.files) {
      const imageBuffer = file.buffer;

      const optimizedImg = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "Me/Dresses",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.log("Cloudinary error:", error);
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamFier.createReadStream(optimizedImg).pipe(uploadStream);
      });

      uploadedImage.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    // =========================
    // CREATE VARIANTS
    // =========================

    const finalVariants = parsedVariants.map((variant) => ({
      color: {
        name: variant.color.name,
        code: variant.color.code || "#000000",
      },

      images: uploadedImage,

      sizes: variant.sizes.map((size) => ({
        size: size.size,
        stock: Number(size.stock) || 0,
      })),
    }));

    // =========================
    // TOTAL STOCK
    // =========================

    const totalStock = finalVariants.reduce(
      (total, variant) =>
        total +
        variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0),
      0,
    );

    // =========================
    // CREATE PRODUCT
    // =========================

    const createDressData = await dressModel.create({
      name,
      description,
      category,
      price: Number(price),
      realPrice: Number(realPrice),
      discount: Number(discount) || 0,
      stock: totalStock,
      sku: sku?.trim().toUpperCase(),
      status,
      brand: existBrand._id,

      details: parsedDetails,

      variants: finalVariants,
    });

    // =========================
    // POPULATE BRAND
    // =========================

    const populatedProduct = await dressModel
      .findById(createDressData._id)
      .populate("brand");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.log("Error in create dress:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await dressModel
      .find()
      .populate("brand")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

const updateProducts = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      price,
      realPrice,
      discount,
      brand,
      details,
      variants,
      sku,
      status,
    } = req.body;

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!brand || !mongoose.Types.ObjectId.isValid(brand)) {
      return res.status(400).json({
        success: false,
        message: "Valid brand is required",
      });
    }

    const existProduct = await dressModel.findById(id);

    if (!existProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const existBrand = await brandModel.findById(brand);

    if (!existBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (!variants) {
      return res.status(400).json({
        success: false,
        message: "Variants are required",
      });
    }

    let parsedDetails = {};

    if (details) {
      try {
        parsedDetails =
          typeof details === "string" ? JSON.parse(details) : details;

        if (typeof parsedDetails !== "object" || Array.isArray(parsedDetails)) {
          return res.status(400).json({
            success: false,
            message: "Details must be an object",
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid details format",
        });
      }
    }

    let updatedVariants;

    try {
      updatedVariants = JSON.parse(variants);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid variants format",
      });
    }

    if (!Array.isArray(updatedVariants)) {
      return res.status(400).json({
        success: false,
        message: "Variants must be an array",
      });
    }

    const oldImages = existProduct.variants?.[0]?.images || [];

    if (req.files && req.files.length > 0) {
      const newImages = [];

      for (const file of req.files) {
        const buffer = await sharp(file.buffer)
          .webp({ quality: 80 })
          .toBuffer();

        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "Me/Dresses",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                console.log("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            },
          );

          streamFier.createReadStream(buffer).pipe(uploadStream);
        });

        newImages.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }

      if (updatedVariants.length > 0) {
        updatedVariants[0].images = newImages;
      }
    } else {
      if (updatedVariants.length > 0) {
        updatedVariants[0].images = oldImages;
      }
    }

    const updateData = {
      name,
      description,
      category,
      price,
      realPrice,
      discount,
      brand: existBrand._id,
      variants: updatedVariants,
      details: parsedDetails,
      sku,
      status,
    };

    const updatedProduct = await dressModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product update failed",
      });
    }

    if (req.files && req.files.length > 0) {
      for (const oldImage of oldImages) {
        if (oldImage.publicId) {
          try {
            await cloudinary.uploader.destroy(oldImage.publicId, {
              resource_type: "image",
            });

            console.log("Deleted old Cloudinary image:", oldImage.publicId);
          } catch (cloudinaryError) {
            console.log(
              "Failed to delete old Cloudinary image:",
              cloudinaryError,
            );
          }
        }
      }
    }

    const populatedProduct = await dressModel
      .findById(updatedProduct._id)
      .populate("brand");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.log("UPDATE PRODUCT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productExists = await dressModel.findById(id);

    if (!productExists) {
      return res
        .status(404)
        .json({ success: false, message: "product doesn't Exist" });
    }

    for (const variant of productExists.variants) {
      for (const image of variant.images) {
        if (image.publicId) {
          await cloudinary.uploader.destroy(image.publicId);
        }
      }
    }

    await dressModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product and Cloudinary images deleted successfully",
    });
  } catch (error) {
    console.log("error in delete product", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

module.exports = {
  createDress,
  getProducts,
  updateProducts,
  deleteProduct,
};
