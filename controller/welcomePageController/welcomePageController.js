const welcomePageModel = require("../../model/welcomePageModel/welcomePageModel");
const sharp = require("sharp");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");

const createWelcomePageImage = async (req, res) => {
  try {
    const { status } = req.body;
    if (!req.files?.welcomeImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "welcome image is required",
      });
    }

    const welcomeImageFile = req.files.welcomeImage[0];

    const optimizeImage = await sharp(welcomeImageFile.buffer)
      .webp({ quality: 80 })
      .toBuffer();

    const uploadWelcomeImage = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "Me/WelcomePage",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.log("error in upload welcome Image", error);
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      streamiFier.createReadStream(optimizeImage).pipe(upload);
    });

    const createImage = await welcomePageModel.create({
      welcomeImage: {
        url: uploadWelcomeImage.secure_url,
        publicId: uploadWelcomeImage.public_id,
      },
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Welcome page image uploaded successfully",
      welcomeImage: createImage,
    });
  } catch (error) {
    console.log("error in create welcome image", error);

    return res.status(500).json({
      success: false,
      message: "failed to create welcome image",
      error: error.message,
    });
  }
};

const getWelcomeImage = async (req, res) => {
  try {
    const findWelcomeImage = await welcomePageModel.find();

    if (findWelcomeImage.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Welcome image doesn't exist",
      });
    }

    return res.status(200).json({
      success: true,
      welcomepageImageData: findWelcomeImage,
    });
  } catch (error) {
    console.log("error in get welcome image", error);

    return res.status(500).json({
      success: false,
      message: "failed to get welcome image",
      error: error.message,
    });
  }
};

const updateWelcomeImage = async (req, res) => {
  let newPublicId = null;

  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingWelcomeImage = await welcomePageModel.findById(id);

    if (!existingWelcomeImage) {
      return res.status(404).json({
        success: false,
        message: "Welcome image doesn't exist",
      });
    }

    const updateData = {};
    let oldPublicId = null;

    if (status !== undefined) {
      if (!["Active", "Inactive"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status",
        });
      }

      updateData.status = status;
    }

    if (req.files?.welcomeImage?.[0]) {
      const welcomeImageFile = req.files.welcomeImage[0];

      const optimizeImage = await sharp(welcomeImageFile.buffer)
        .webp({ quality: 80 })
        .toBuffer();

      const uploadWelcomeImage = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: "Me/WelcomePage",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              console.log("error in upload welcome Image", error);
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamiFier.createReadStream(optimizeImage).pipe(upload);
      });

      newPublicId = uploadWelcomeImage.public_id;
      oldPublicId = existingWelcomeImage.welcomeImage?.publicId;

      updateData.welcomeImage = {
        url: uploadWelcomeImage.secure_url,
        publicId: uploadWelcomeImage.public_id,
      };
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    const updateImage = await welcomePageModel.findByIdAndUpdate(
      id,
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updateImage) {
      if (newPublicId) {
        await cloudinary.uploader.destroy(newPublicId);
        newPublicId = null;
      }

      return res.status(404).json({
        success: false,
        message: "Welcome image not found",
      });
    }

    // Delete old image only after successful database update
    if (oldPublicId && newPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (error) {
        console.log("error deleting old welcome image", error);
      }
    }

    newPublicId = null;

    return res.status(200).json({
      success: true,
      message: "Welcome image updated successfully",
      welcomeImage: updateImage,
    });
  } catch (error) {
    if (newPublicId) {
      try {
        await cloudinary.uploader.destroy(newPublicId);
      } catch (cloudinaryError) {
        console.log("Error cleaning up new image", cloudinaryError);
      }
    }

    console.log("error in update welcome image", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update welcome image",
      error: error.message,
    });
  }
};

const deleteWelcomeImage = async (req, res) => {
  try {
    const findWelcomeImage = await welcomePageModel.findOne();

    if (!findWelcomeImage) {
      return res.status(404).json({
        success: false,
        message: "Welcome image doesn't exist",
      });
    }

    const publicId = findWelcomeImage.welcomeImage?.publicId;

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    const deleteWelcomeImageData = await welcomePageModel.findByIdAndDelete(
      findWelcomeImage._id,
    );

    if (!deleteWelcomeImageData) {
      return res.status(404).json({
        success: false,
        message: "Welcome image data not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Welcome image and its data deleted successfully",
      deletedWelcomeImage: deleteWelcomeImageData,
    });
  } catch (error) {
    console.log("error in delete welcome image", error);

    return res.status(500).json({
      success: false,
      message: "failed to delete welcome image",
      error: error.message,
    });
  }
};

module.exports = {
  createWelcomePageImage,
  getWelcomeImage,
  updateWelcomeImage,
  deleteWelcomeImage,
};
