const brandModel = require("../../model/brand/brand");
const dressModel = require("../../model/dress/dress");
const sharp = require("sharp");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");

const createBrand = async (req, res) => {
  try {
    const { brandName, brandSlogan, status } = req.body;

    if (!brandName?.trim()) {
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
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.log("Cloudinary error in brand:", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      streamiFier.createReadStream(optimizeImage).pipe(uploadBrandImage);
    });

    const brandCreateFn = await brandModel.create({
      brandName: brandName.trim(),

      brandIcon: {
        url: result.secure_url,
        publicId: result.public_id,
      },

      brandSlogan: brandSlogan?.trim() || "",
      status: status || "Active",
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
          status: brand.status,
          productCount,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      brand: brandWithCount,
    });
  } catch (error) {
    console.log("Get brands error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get brands",
      error: error.message,
    });
  }
};

const updateBrands = async (req, res) => {
  try {
    const { id } = req.params;
    const { brandName, brandSlogan, status } = req.body;

    if (!brandName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const existingBrand = await brandModel.findById(id);

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand is not found",
      });
    }

    const updateData = {
      brandName: brandName.trim(),
      brandSlogan: brandSlogan?.trim() || "",
      status,
    };

    if (req.file) {
      const imageBuffer = req.file.buffer;

      const optimizeImage = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        const uploadBrand = cloudinary.uploader.upload_stream(
          {
            folder: "Me/Brands",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.log("Cloudinary error in brand:", error);
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamiFier.createReadStream(optimizeImage).pipe(uploadBrand);
      });

      updateData.brandIcon = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      const oldPublicId = existingBrand.brandIcon?.publicId;

      const updateBrandFn = await brandModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "image",
          });

          console.log("Old brand image deleted:", oldPublicId);
        } catch (deleteError) {
          console.log("Failed to delete old brand image:", deleteError);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Brand updated successfully",
        brand: updateBrandFn,
      });
    }

    const updateBrandFn = await brandModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand: updateBrandFn,
    });
  } catch (error) {
    console.log("Update brand error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update brand",
      error: error.message,
    });
  }
};

const deleteBrands = async (req, res) => {
  try {
    const { id } = req.params;

    const existingBrand = await brandModel.findById(id);

    if (!existingBrand) {
      return res
        .status(404)
        .json({ success: false, message: " this brand doesn't exist" });
    }

    const productCount = await dressModel.countDocuments({
      brand: id,
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete this brand because products are using it",
        productCount,
      });
    }

    if (existingBrand.brandIcon?.publicId) {
      await cloudinary.uploader.destroy(existingBrand.brandIcon.publicId);
    }

    await brandModel.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Brand and brand image deleted successfully",
    });
  } catch (error) {
    console.log("error in delete brands", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete brands",
      error: error.message,
    });
  }
};

module.exports = {
  createBrand,
  getBrands,
  updateBrands,
  deleteBrands,
};
