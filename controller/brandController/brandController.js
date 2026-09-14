const brandModel = require("../../model/brand/brand");
const dressModel = require("../../model/dress/dress");
const sharp = require("sharp");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");
const createBrand = async (req, res) => {
  try {
    const { brandName, brandSlogan, status } = req.body;

    if (!brandName) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Brand icon is required",
      });
    }

    const imageBuffer = req.file.buffer;
    const optimizeImage = await sharp(imageBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    const result = await new Promise((resolve, reject) => {
      const uploadBrandImage = cloudinary.uploader.upload_stream(
        {
          folder: "Me/Brands",
        },
        (error, result) => {
          if (error) {
            console.log("cloudinary error in brand", error);

            reject(error);
          } else {
            console.log("brand image uploaded successfull", result);

            resolve(result);
          }
        },
      );
      streamiFier.createReadStream(optimizeImage).pipe(uploadBrandImage);
    });

    const brandCreateFn = await brandModel.create({
      brandName,
      brandIcon: result.secure_url,
      brandSlogan,
      status
    });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand: brandCreateFn,
    });
  } catch (error) {
    console.log("Create brand error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create brand",
      error: error.message,
    });
  }
};

const getBrands = async (req, res) => {
  try {
    const getbrandFn = await brandModel.find().sort({ brandName: 1 });

    const brandWithCount = await Promise.all(
      getbrandFn.map(async (brand) => {
        const productCount = await dressModel.countDocuments({
          brand: brand._id,
        });

        return {
          _id: brand._id,
          brandName: brand.brandName,
          brandIcon: brand.brandIcon,
          brandSlogan: brand.brandSlogan,
          status:brand.status,
          productCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      brand: brandWithCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get brands",
      error: error.message,
    });
  }
};

module.exports = { createBrand, getBrands };
