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
      variants,
      sku,
      status,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
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
        message: "Variants are required",
      });
    }

    const existbrand = await brandModel.findById(brand);
    if (!existbrand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    let parsedVariants;

    try {
      parsedVariants = JSON.parse(variants);

      if (!Array.isArray(parsedVariants)) {
        return res.status(400).json({
          message: "Variants must be an array",
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: "Invalid variants format",
      });
    }

    console.log("PARSED VARIANTS:", parsedVariants);

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
          },
          (error, result) => {
            if (error) {
              console.log("Cloudinary error:", error);
              reject(error);
            } else {
              console.log("Upload success:", result);
              resolve(result);
            }
          },
        );

        streamFier.createReadStream(optimizedImg).pipe(uploadStream);
      });

      uploadedImage.push(result.secure_url);
    }

    console.log("UPLOADED IMAGES:", uploadedImage);

    const finalVariants = parsedVariants.map((variant) => ({
      color: {
        name: variant.color.name,
        code: variant.color.code || "#000000",
      },

      images: uploadedImage,

      sizes: variant.sizes.map((size) => ({
        size: size.size,
        stock: Number(size.stock),
      })),
    }));

    const totalStock = finalVariants.reduce(
      (total, variant) =>
        total +
        variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0),
      0,
    );

    console.log("FINAL VARIANTS:", finalVariants);
    console.log("TOTAL STOCK:", totalStock);

    const createDressData = await dressModel.create({
      name,
      description,
      category,
      price,
      realPrice,
      stock: totalStock,
      sku,
      status,
      brand: existbrand._id,

      variants: finalVariants,
    });

    const populatedProduct = await dressModel
      .findById(createDressData._id)
      .populate("brand");
    console.log("CREATED DRESS:", populatedProduct);
    console.log("CREATED DRESS:", createDressData);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: populatedProduct,
    });
  } catch (error) {
    console.log("Error in create dress:", error);

    return res.status(500).json({
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// get products

const getProducts = async (req, res) => {
  try {
    const products = await dressModel
      .find()
      .populate("brand")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get products",
    });
  }
};

///update dres///////////////////////

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
      variants,
      sku,
      status,
    } = req.body;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }
    if (!brand || !mongoose.Types.ObjectId.isValid(brand)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid brand is required" });
    }
    const existProduct = await dressModel.findById(id);
    if (!existProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const existBrand = await brandModel.findById(brand);
    if (!existBrand) {
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    }
    let updatedVariants = JSON.parse(variants);
    if (!Array.isArray(updatedVariants)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid variants" });
    }
    if (req.files && req.files.length > 0) {
      const newImages = [];
      for (const file of req.files) {
        const buffer = await sharp(file.buffer)
          .webp({ quality: 80 })
          .toBuffer();
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "ME/Dressess" },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            },
          );
          streamFier.createReadStream(buffer).pipe(stream);
        });
        newImages.push(result.secure_url);
      }
      if (updatedVariants.length > 0) {
        updatedVariants[0].images = newImages;
      }
    } else {
      const oldImages = existProduct.variants?.[0]?.images || [];
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
      brand,
      variants: updatedVariants,
      sku,
      status,
    };
    const updatedProduct = await dressModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    return res
      .status(200)
      .json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      });
  } catch (error) {
    console.log("UPDATE ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDress,
  getProducts,
  updateProducts,
  // updateDress,
  // getDressByCategory,
  // deleteDress,
};
