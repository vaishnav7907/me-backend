const dressModel = require("../../model/dress/dress");
const brandModel = require("../../model/brand/brand");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const sharp = require("sharp");
const streamFier = require("streamifier");
const mongoose = require("mongoose");
///create dress //////////////////////
// const createDress = async (req, res) => {
//   try {
//     console.log("REQ BODY:", req.body);
//     console.log("REQ FILES:", req.files);

//     const {
//       name,
//       description,
//       category,
//       price,
//       realPrice,
//       brand,
//       details,
//       variants,
//       sku,
//       status,
//       discount,
//     } = req.body;

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: "At least one image is required",
//       });
//     }

//     if (!brand) {
//       return res.status(400).json({
//         success: false,
//         message: "Brand is required",
//       });
//     }

//     if (!variants) {
//       return res.status(400).json({
//         success: false,
//         message: "Variants are required",
//       });
//     }

//     const existBrand = await brandModel.findById(brand);

//     if (!existBrand) {
//       return res.status(404).json({
//         success: false,
//         message: "Brand not found",
//       });
//     }

//     // =========================
//     // PARSE VARIANTS
//     // =========================

//     let parsedVariants;

//     try {
//       parsedVariants =
//         typeof variants === "string" ? JSON.parse(variants) : variants;

//       if (!Array.isArray(parsedVariants)) {
//         return res.status(400).json({
//           success: false,
//           message: "Variants must be an array",
//         });
//       }
//     } catch (error) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid variants format",
//       });
//     }

//     // =========================
//     // PARSE DETAILS
//     // =========================

//     let parsedDetails = {};

//     if (details) {
//       try {
//         parsedDetails =
//           typeof details === "string" ? JSON.parse(details) : details;

//         if (typeof parsedDetails !== "object" || Array.isArray(parsedDetails)) {
//           return res.status(400).json({
//             success: false,
//             message: "Details must be an object",
//           });
//         }
//       } catch (error) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid details format",
//         });
//       }
//     }

//     // =========================
//     // UPLOAD IMAGES
//     // =========================

//     const uploadedImage = [];

//     for (const file of req.files) {
//       const imageBuffer = file.buffer;

//       const optimizedImg = await sharp(imageBuffer)
//         .webp({ quality: 80 })
//         .toBuffer();

//       const result = await new Promise((resolve, reject) => {
//         const uploadStream = cloudinary.uploader.upload_stream(
//           {
//             folder: "Me/Dresses",
//             resource_type: "image",
//           },
//           (error, result) => {
//             if (error) {
//               console.log("Cloudinary error:", error);
//               reject(error);
//             } else {
//               resolve(result);
//             }
//           },
//         );

//         streamFier.createReadStream(optimizedImg).pipe(uploadStream);
//       });

//       uploadedImage.push({
//         url: result.secure_url,
//         publicId: result.public_id,
//       });
//     }

//     // =========================
//     // CREATE VARIANTS
//     // =========================

//     const finalVariants = parsedVariants.map((variant) => ({
//       color: {
//         name: variant.color.name,
//         code: variant.color.code || "#000000",
//       },

//       images: uploadedImage,

//       sizes: variant.sizes.map((size) => ({
//         size: size.size,
//         stock: Number(size.stock) || 0,
//       })),
//     }));

//     // =========================
//     // TOTAL STOCK
//     // =========================

//     const totalStock = finalVariants.reduce(
//       (total, variant) =>
//         total +
//         variant.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0),
//       0,
//     );

//     // =========================
//     // CREATE PRODUCT
//     // =========================

//     const createDressData = await dressModel.create({
//       name,
//       description,
//       category,
//       price: Number(price),
//       realPrice: Number(realPrice),
//       discount: Number(discount) || 0,
//       stock: totalStock,
//       sku: sku?.trim().toUpperCase(),
//       status,
//       brand: existBrand._id,

//       details: parsedDetails,

//       variants: finalVariants,
//     });

//     // =========================
//     // POPULATE BRAND
//     // =========================

//     const populatedProduct = await dressModel
//       .findById(createDressData._id)
//       .populate("brand");

//     return res.status(201).json({
//       success: true,
//       message: "Product created successfully",
//       product: populatedProduct,
//     });
//   } catch (error) {
//     console.log("Error in create dress:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Failed to create product",
//       error: error.message,
//     });
//   }
// };

const createDress = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      brand,
      price,
      realPrice,
      discount,
      sku,
      status,
      details,
      variants,
    } = req.body;

    if (!brand) {
      return res.status(400).json({
        success: false,
        message: "Brand is required",
      });
    }

    const brandExist = await brandModel.findById(brand);

    if (!brandExist) {
      return res.status(400).json({
        success: false,
        message: "brand is not found",
      });
    }

    if (price === undefined || price === "") {
      return res
        .status(400)
        .json({ success: false, message: "Price is required" });
    }
    if (realPrice === undefined || realPrice === "") {
      return res
        .status(400)
        .json({ success: false, message: "Real price is required" });
    }
    if (Number(price) > Number(realPrice)) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be greater than real price",
      });
    }
    if (!sku) {
      return res
        .status(400)
        .json({ success: false, message: "SKU is required" });
    }
    const skuExist = await dressModel.findOne({ sku: sku.toUpperCase() });
    if (skuExist) {
      return res
        .status(400)
        .json({ success: false, message: "SKU already exists" });
    }

    let parsedDetails = {};

    if (details) {
      try {
        parsedDetails =
          typeof details === "string" ? JSON.parse(details) : details;
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid details format" });
      }
    }

    let parsedVariants = [];

    if (variants) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch (error) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid variants format" });
      }
    }

    if (!Array.isArray(parsedVariants)) {
      return res
        .status(400)
        .json({ success: false, message: "Variants must be an array" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Product images are required" });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageBuffer = await sharp(file.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      const uploadResult = await new Promise((resolve, reject) => {
        const imageUpload = cloudinary.uploader.upload_stream(
          {
            folder: "Me/Dresses",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamFier.createReadStream(imageBuffer).pipe(imageUpload);
      });

      uploadedImages.push({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    }

    let imageIndex = 0;

    const finalVariants = parsedVariants.map((variant, index) => {
      const mainImage = uploadedImages[imageIndex];

      if (!mainImage) {
        throw new Error(`main image is missing for variant ${index + 1}`);
      }

      imageIndex++;

      const subImages = [];

      const subImageCount = Array.isArray(variant.color?.subImages)
        ? variant.color.subImages.length
        : 0;

      for (let i = 0; i < subImageCount; i++) {
        const subImage = uploadedImages[imageIndex];

        if (!subImage) {
          throw new Error(`Sub image is missing for variant ${index + 1}`);
        }

        subImages.push({
          url: subImage.url,
          publicId: subImage.publicId,
        });

        imageIndex++;
      }

      return {
        color: {
          name: variant.color.name,
          code: variant.color.code || "#000000",
          mainImage: { url: mainImage.url, publicId: mainImage.publicId },
          subImages,
        },
        sizes: variant.sizes || [],
      };
    });

    if (imageIndex !== uploadedImages.length) {
      throw new Error("Some uploaded images are not assigned to variants");
    }

    const createProduct = await dressModel.create({
      name,
      description,
      category,
      brand,
      price,
      realPrice,
      discount,
      sku,
      status,
      details: parsedDetails,
      variants: finalVariants,
    });

    const product = await dressModel
      .findById(createProduct._id)
      .populate("brand");

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
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

    const existProduct = await dressModel.findById(id);

    if (!existProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let existBrand = null;

    if (brand !== undefined && brand !== "") {
      if (!mongoose.Types.ObjectId.isValid(brand)) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand ID",
        });
      }

      existBrand = await brandModel.findById(brand);

      if (!existBrand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }
    }

    let parsedDetails;

    if (details !== undefined && details !== "") {
      try {
        parsedDetails =
          typeof details === "string" ? JSON.parse(details) : details;

        if (
          typeof parsedDetails !== "object" ||
          parsedDetails === null ||
          Array.isArray(parsedDetails)
        ) {
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

    if (variants !== undefined && variants !== "") {
      try {
        updatedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
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

      if (updatedVariants.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one variant is required",
        });
      }

      for (let i = 0; i < updatedVariants.length; i++) {
        const variant = updatedVariants[i];

        if (!variant.color) {
          return res.status(400).json({
            success: false,
            message: `Color is required for variant ${i + 1}`,
          });
        }

        if (!variant.color.name || !variant.color.name.trim()) {
          return res.status(400).json({
            success: false,
            message: `Color name is required for variant ${i + 1}`,
          });
        }

        if (
          !variant.color.code ||
          !/^#[0-9A-Fa-f]{6}$/.test(variant.color.code)
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid color code for variant ${i + 1}`,
          });
        }

        if (!Array.isArray(variant.sizes)) {
          return res.status(400).json({
            success: false,
            message: `Sizes must be an array for variant ${i + 1}`,
          });
        }

        variant.sizes = variant.sizes.map((sizeItem) => ({
          size: sizeItem.size,
          stock: Math.max(0, Number(sizeItem.stock) || 0),
        }));
      }
    }

    const oldVariants = existProduct.variants || [];

    const oldImages = [];

    for (const variant of oldVariants) {
      if (variant.color?.mainImage?.publicId) {
        oldImages.push({
          url: variant.color.mainImage.url,
          publicId: variant.color.mainImage.publicId,
        });
      }

      if (variant.color?.subImages?.length > 0) {
        for (const image of variant.color.subImages) {
          if (image.publicId) {
            oldImages.push({
              url: image.url,
              publicId: image.publicId,
            });
          }
        }
      }
    }

    if (updatedVariants) {
      const uploadedImages = [];

      if (req.files && req.files.length > 0) {
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

          uploadedImages.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      }

      let uploadIndex = 0;

      for (
        let variantIndex = 0;
        variantIndex < updatedVariants.length;
        variantIndex++
      ) {
        const newVariant = updatedVariants[variantIndex];

        const oldVariant = oldVariants[variantIndex];

        const oldMainImage = oldVariant?.color?.mainImage || null;

        const oldSubImages = oldVariant?.color?.subImages || [];

        const newMainImage = newVariant.color?.mainImage;

        if (newMainImage?.replace === true) {
          if (!uploadedImages[uploadIndex]) {
            return res.status(400).json({
              success: false,
              message: `New main image is missing for variant ${
                variantIndex + 1
              }`,
            });
          }

          newVariant.color.mainImage = uploadedImages[uploadIndex];

          uploadIndex++;
        } else if (newMainImage?.publicId) {
          newVariant.color.mainImage = {
            url: newMainImage.url,
            publicId: newMainImage.publicId,
          };
        } else if (oldMainImage) {
          newVariant.color.mainImage = oldMainImage;
        } else {
          return res.status(400).json({
            success: false,
            message: `Main image is required for variant ${variantIndex + 1}`,
          });
        }

        const newSubImages = Array.isArray(newVariant.color?.subImages)
          ? newVariant.color.subImages
          : [];

        const finalSubImages = [];

        for (let subIndex = 0; subIndex < newSubImages.length; subIndex++) {
          const subImage = newSubImages[subIndex];

          if (subImage?.replace === true) {
            if (!uploadedImages[uploadIndex]) {
              return res.status(400).json({
                success: false,
                message: `New sub image is missing for variant ${
                  variantIndex + 1
                }, image ${subIndex + 1}`,
              });
            }

            finalSubImages.push(uploadedImages[uploadIndex]);

            uploadIndex++;
          } else if (subImage?.publicId) {
            finalSubImages.push({
              url: subImage.url,
              publicId: subImage.publicId,
            });
          } else if (oldSubImages[subIndex]) {
            finalSubImages.push(oldSubImages[subIndex]);
          }
        }

        newVariant.color.subImages = finalSubImages;

        delete newVariant.color.mainImage.replace;

        for (const subImage of newVariant.color.subImages) {
          delete subImage.replace;
        }
      }

      if (uploadIndex !== uploadedImages.length) {
        return res.status(400).json({
          success: false,
          message: "Uploaded images were not assigned correctly",
        });
      }
    }

    const updateData = {};

    if (name !== undefined && name.trim() !== "") {
      updateData.name = name.trim();
    }

    if (description !== undefined && description.trim() !== "") {
      updateData.description = description.trim();
    }

    if (category !== undefined && category !== "") {
      updateData.category = category;
    }

    if (price !== undefined && price !== "") {
      updateData.price = Number(price);
    }

    if (realPrice !== undefined && realPrice !== "") {
      updateData.realPrice = Number(realPrice);
    }

    if (discount !== undefined && discount !== "") {
      updateData.discount = Number(discount);
    }

    if (existBrand) {
      updateData.brand = existBrand._id;
    }

    if (parsedDetails !== undefined) {
      updateData.details = parsedDetails;
    }

    if (updatedVariants !== undefined) {
      updateData.variants = updatedVariants;
    }

    if (sku !== undefined && sku.trim() !== "") {
      updateData.sku = sku.trim().toUpperCase();
    }

    if (status !== undefined && status !== "") {
      updateData.status = status;
    }

    const finalPrice =
      updateData.price !== undefined ? updateData.price : existProduct.price;

    const finalRealPrice =
      updateData.realPrice !== undefined
        ? updateData.realPrice
        : existProduct.realPrice;

    if (finalRealPrice < finalPrice) {
      return res.status(400).json({
        success: false,
        message: "Real price should be greater than or equal to selling price",
      });
    }

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

    if (updatedVariants) {
      const newImageIds = [];

      for (const variant of updatedProduct.variants) {
        if (variant.color?.mainImage?.publicId) {
          newImageIds.push(variant.color.mainImage.publicId);
        }

        if (variant.color?.subImages?.length > 0) {
          for (const image of variant.color.subImages) {
            if (image.publicId) {
              newImageIds.push(image.publicId);
            }
          }
        }
      }

      for (const oldImage of oldImages) {
        if (oldImage.publicId && !newImageIds.includes(oldImage.publicId)) {
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
      return res.status(404).json({
        success: false,
        message: "Product doesn't exist",
      });
    }

    for (const variant of productExists.variants || []) {
      const mainImage = variant.color?.mainImage;

      if (mainImage?.publicId) {
        try {
          await cloudinary.uploader.destroy(mainImage.publicId, {
            resource_type: "image",
          });

          console.log("Main product image deleted:", mainImage.publicId);
        } catch (error) {
          console.log(
            "Failed to delete main product image:",
            mainImage.publicId,
            error,
          );
        }
      }

      for (const image of variant.color?.subImages || []) {
        if (image?.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId, {
              resource_type: "image",
            });

            console.log("Product sub image deleted:", image.publicId);
          } catch (error) {
            console.log(
              "Failed to delete product sub image:",
              image.publicId,
              error,
            );
          }
        }
      }
    }

    await dressModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Product and Cloudinary images deleted successfully",
    });
  } catch (error) {
    console.log("Error in delete product:", error);

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
