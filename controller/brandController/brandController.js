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

    if (!req.files?.brandIcon?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Brand icon is required",
      });
    }

    if (!req.files?.brandImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Brand image is required",
      });
    }

    const brandIconFile = req.files.brandIcon[0];
    const brandImageFile = req.files.brandImage[0];

    const optimizeBrandIcon = await sharp(brandIconFile.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const optimizeBrandImage = await sharp(brandImageFile.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const brandIconResult = await new Promise((resolve, reject) => {
      const uploadBrandIcon = cloudinary.uploader.upload_stream(
        {
          folder: "Me/Brands/Icons",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.log("Cloudinary error in brand icon:", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      streamiFier.createReadStream(optimizeBrandIcon).pipe(uploadBrandIcon);
    });

    const brandImageResult = await new Promise((resolve, reject) => {
      const uploadBrandImage = cloudinary.uploader.upload_stream(
        {
          folder: "Me/Brands/Images",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.log("Cloudinary error in brand image:", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      streamiFier.createReadStream(optimizeBrandImage).pipe(uploadBrandImage);
    });

    const brandCreateFn = await brandModel.create({
      brandName: brandName.trim(),

      brandIcon: {
        url: brandIconResult.secure_url,
        publicId: brandIconResult.public_id,
      },

      brandImage: {
        url: brandImageResult.secure_url,
        publicId: brandImageResult.public_id,
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
          brandImage: brand.brandImage,
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

    const {
      brandName,
      brandSlogan,
      status,
      removeBrandIcon,
      removeBrandBackground,
    } = req.body;

    const existingBrand = await brandModel.findById(id);

    if (!existingBrand) {
      return res.status(404).json({
        success: false,
        message: "Brand is not found",
      });
    }

    const updateData = {};

    let oldIconPublicId = null;
    let oldImagePublicId = null;

    if (req.files?.brandIcon?.[0]) {
      const brandIconFile = req.files.brandIcon[0];

      const optimizeBrandIcon = await sharp(brandIconFile.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      const brandIconResult = await new Promise((resolve, reject) => {
        const uploadBrandIcon = cloudinary.uploader.upload_stream(
          {
            folder: "Me/Brands/Icons",
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

        streamiFier.createReadStream(optimizeBrandIcon).pipe(uploadBrandIcon);
      });

      oldIconPublicId = existingBrand.brandIcon?.publicId;

      updateData.brandIcon = {
        url: brandIconResult.secure_url,
        publicId: brandIconResult.public_id,
      };
    }

    if (req.files?.brandImage?.[0]) {
      const brandImageFile = req.files.brandImage[0];

      const optimizeBrandImage = await sharp(brandImageFile.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      const brandImageResult = await new Promise((resolve, reject) => {
        const uploadBrandImage = cloudinary.uploader.upload_stream(
          {
            folder: "Me/Brands/Images",
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

        streamiFier.createReadStream(optimizeBrandImage).pipe(uploadBrandImage);
      });

      oldImagePublicId = existingBrand.brandImage?.publicId;

      updateData.brandImage = {
        url: brandImageResult.secure_url,
        publicId: brandImageResult.public_id,
      };
    }

    if (brandName !== undefined && brandName !== "") {
      updateData.brandName = brandName;
    }

    if (brandSlogan !== undefined) {
      updateData.brandSlogan = brandSlogan;
    }

    if (status !== undefined && status !== "") {
      updateData.status = status;
    }

    if (removeBrandIcon === "true" && !req.files?.brandIcon?.[0]) {
      updateData.brandIcon = null;
      oldIconPublicId = existingBrand.brandIcon?.publicId;
    }

    if (removeBrandBackground === "true" && !req.files?.brandImage?.[0]) {
      updateData.brandImage = null;
      oldImagePublicId = existingBrand.brandImage?.publicId;
    }

    const updateBrandFn = await brandModel.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    });

    if (oldIconPublicId) {
      try {
        await cloudinary.uploader.destroy(oldIconPublicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.log("Failed to delete old brand icon:", error);
      }
    }

    if (oldImagePublicId) {
      try {
        await cloudinary.uploader.destroy(oldImagePublicId, {
          resource_type: "image",
        });
      } catch (error) {
        console.log("Failed to delete old brand image:", error);
      }
    }

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
      return res.status(404).json({
        success: false,
        message: "This brand doesn't exist",
      });
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
      try {
        await cloudinary.uploader.destroy(existingBrand.brandIcon.publicId, {
          resource_type: "image",
        });

        console.log("Brand icon deleted:", existingBrand.brandIcon.publicId);
      } catch (error) {
        console.log("Failed to delete brand icon:", error);
      }
    }

    if (existingBrand.brandImage?.publicId) {
      try {
        await cloudinary.uploader.destroy(existingBrand.brandImage.publicId, {
          resource_type: "image",
        });

        console.log("Brand image deleted:", existingBrand.brandImage.publicId);
      } catch (error) {
        console.log("Failed to delete brand image:", error);
      }
    }

    await brandModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.log("Error in delete brands:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete brand",
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
