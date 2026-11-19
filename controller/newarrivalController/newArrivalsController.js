const dressModel = require("../../model/dress/dress");
const latestArrivalsModel = require("../../model/newArrivals/newArrivalsModel");
const sharp = require("sharp");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");
const getNewArrivals = async (req, res) => {
  try {
    const latestProducts = await dressModel
      .find({})
      .populate("brand")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products: latestProducts,
    });
  } catch (error) {
    console.log("GET NEW ARRIVALS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get new arrivals",
      error: error.message,
    });
  }
};

const createLatestArrivals = async (req, res) => {
  try {
    const { description, category, name, status } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (!category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please select a category",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please select a status",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Latest arrivals image is required",
      });
    }

    const imageBuffer = req.file.buffer;

    const optimizeImage = await sharp(imageBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    const uploadLatestArrivalsImage = await new Promise((resolve, reject) => {
      const uploadImage = cloudinary.uploader.upload_stream(
        {
          folder: "Me/LatestArrivals",
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

      streamiFier.createReadStream(optimizeImage).pipe(uploadImage);
    });

    const createArrivalsFn = await latestArrivalsModel.create({
      name: name.trim(),
      category,
      description: description.trim(),
      arrivalsCategoryImage: {
        url: uploadLatestArrivalsImage.secure_url,
        publicId: uploadLatestArrivalsImage.public_id,
      },
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Latest arrivals created successfully",
      latestArrivals: createArrivalsFn,
    });
  } catch (error) {
    console.log("Create latest arrivals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create latest arrivals",
      error: error.message,
    });
  }
};

const getLatestArrivals = async (req, res) => {
  try {
    const { id } = req.params;

    const getlatestArrivalsFn = await latestArrivalsModel
      .find()
      .sort({ name: 1 });
    res.status(201).json({
      success: true,
      latestArrivalsData: getlatestArrivalsFn,
    });
  } catch (error) {
    console.log("Get Latest Arrivals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get Latest Arrivals",
      error: error.message,
    });
  }
};

const deleteLatestArrivals = async (req, res) => {
  try {
    const { id } = req.params;

    const existingLatestArrivals = await latestArrivalsModel.findById(id);

    if (!existingLatestArrivals) {
      return res
        .status(404)
        .json({ success: false, message: "didn't exist latest arrivals" });
    }

    if (existingLatestArrivals.arrivalsCategoryImage?.publicId) {
      await cloudinary.uploader.destroy(
        existingLatestArrivals.arrivalsCategoryImage.publicId,
      );
    }

    await latestArrivalsModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "latest aarivals image  and data are deleted successfully",
    });
  } catch (error) {
    console.log("error in delete latest arrivals", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete latest arrivals",
      error: error.message,
    });
  }
};

const updateLatestArrivals = async (req, res) => {
  let newPublicId = null;

  try {
    const { description, category, name, status } = req.body;
    const { id } = req.params;

    const existingLatestArrivals = await latestArrivalsModel.findById(id);

    if (!existingLatestArrivals) {
      return res.status(404).json({
        success: false,
        message: "Latest arrival not found",
      });
    }

    const updateLatestArrivalsData = {};
    let oldPublicId = null;

    // Upload new image
    if (req.file) {
      const imageBuffer = req.file.buffer;

      const optimizeImage = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        const uploadLatestArrivals = cloudinary.uploader.upload_stream(
          {
            folder: "Me/LatestArrivals",
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

        streamiFier.createReadStream(optimizeImage).pipe(uploadLatestArrivals);
      });

      oldPublicId =
        existingLatestArrivals.arrivalsCategoryImage?.publicId || null;

      newPublicId = result.public_id;

      updateLatestArrivalsData.arrivalsCategoryImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // Update name
    if (name !== undefined && name.trim() !== "") {
      updateLatestArrivalsData.name = name.trim();
    }

    // Update description
    if (description !== undefined && description.trim() !== "") {
      updateLatestArrivalsData.description = description.trim();
    }

    // Update category
    if (category !== undefined && category.trim() !== "") {
      updateLatestArrivalsData.category = category.trim();
    }

    // Update status
    if (status !== undefined && status !== "") {
      updateLatestArrivalsData.status = status;
    }

    if (Object.keys(updateLatestArrivalsData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    const updatedLatestArrivals = await latestArrivalsModel.findByIdAndUpdate(
      id,
      updateLatestArrivalsData,
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedLatestArrivals) {
      if (newPublicId) {
        await cloudinary.uploader.destroy(newPublicId, {
          resource_type: "image",
        });
        newPublicId = null;
      }

      return res.status(404).json({
        success: false,
        message: "Latest arrival not found",
      });
    }

    // Delete old image after successful database update
    if (oldPublicId && newPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
        });

        console.log("Old latest arrival image deleted:", oldPublicId);
      } catch (error) {
        console.log("Failed to delete old latest arrival image:", error);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Latest arrival updated successfully",
      latestArrivals: updatedLatestArrivals,
    });
  } catch (error) {
    // Remove newly uploaded image if update fails
    if (newPublicId) {
      try {
        await cloudinary.uploader.destroy(newPublicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.log("Failed to delete new image:", cloudinaryError);
      }
    }

    console.log("Update latest arrival error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update latest arrival",
      error: error.message,
    });
  }
};

module.exports = {
  getNewArrivals,
  createLatestArrivals,
  getLatestArrivals,
  deleteLatestArrivals,
  updateLatestArrivals,
};
