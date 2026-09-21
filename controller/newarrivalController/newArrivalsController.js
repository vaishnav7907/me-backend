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
    const { description, category, name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "name  Required" });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "description Required" });
    }

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: " select category " });
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
      name,
      category,
      description,
      arrivalsCategoryImage: {
        url: uploadLatestArrivalsImage.secure_url,
        publicId: uploadLatestArrivalsImage.public_id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "latest Arivals created successfully",
      latestArrivals: createArrivalsFn,
    });
  } catch (error) {
    console.log("Create brand error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create latest Arrivals",
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
  try {
    const { description, category, name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "name  Required" });
    }

    if (!description) {
      return res
        .status(400)
        .json({ success: false, message: "description Required" });
    }

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: " select category " });
    }

    const { id } = req.params;
    const existingLatestArrivals = await latestArrivalsModel.findById(id);

    if (!existingLatestArrivals) {
      return res
        .status(404)
        .json({ success: false, message: "didn't exist latest arrivals" });
    }

    const updateLataestArrivalsData = {
      name,
      category,
      description,
    };

    let oldPublicId = null;

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

      oldPublicId = existingLatestArrivals.arrivalsCategoryImage?.publicId;
      updateLataestArrivalsData.arrivalsCategoryImage = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    const updateLatestArrivals = await latestArrivalsModel.findByIdAndUpdate(
      id,
      updateLataestArrivalsData,
      { returnDocument: "after", runValidators: true },
    );

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: "image",
        });

        console.log("Old latest arrival image deleted:", oldPublicId);
      } catch (error) {
        console.log("Failed to delete old latest arrival image:", error);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Latest arrival updated successfully",
      latestArrivals: updateLatestArrivals,
    });
  } catch (error) {
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
