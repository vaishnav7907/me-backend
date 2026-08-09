const dressModel = require("../../model/dress/dress");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const sharp = require("sharp");
const streamFier = require("streamifier");
///create dress //////////////////////
const createDress = async (req, res) => {
  try {
    const {
      color,
      size,
      brandIcon,
      brandName,
      realPrize,
      prize,
      category,
      name,
    } = req.body;
    if (!req.file) {
      return res.status(400).json({
        message: "Image is required",
      });
    }
    const imageBuffer = req.file.buffer;

    // optimize image

    const optimizedImg = await sharp(imageBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    //upload media to cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ME/dressess",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      streamFier.createReadStream(optimizedImg).pipe(uploadStream);
    });

    const image = result.secure_url;
    const createDressData = await dressModel.create({
      color,
      size,
      brandIcon,
      brandName,
      realPrize,
      prize,
      image,
      category,
      name,
    });


    res.status(201).json(createDressData);
  } catch (error) {
    console.log("error in create dress", error);
    res.status(500).json({ message: error });
  }
};

///update dres///////////////////////

const updateDress = async (req, res) => {
  try {
    const {
      color,
      size,
      brandIcon,
      brandName,
      realPrize,
      prize,
      category,
      name,
    } = req.body;

    const { id } = req.params;

    const existingDessData = await dressModel.findById(id);
    if (!existingDessData) {
      return res.status(404).json({
        message: "dress not found",
      });
    }
    // default old image
    let image = existingDessData.image;

    if (req.file) {
      // Get image buffer from RAM
      const imageBuffer = req.file.buffer;

      // optimizeimg
      const optimizeImg = await sharp(imageBuffer)
        .webp({
          quality: 80,
        })
        .toBuffer();

      // upload to cloudinary

      const uploadToCloud = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "ME/dressess",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }

            
          },
        );

        streamFier.createReadStream(optimizeImg).pipe(uploadStream);
      });
      image = uploadToCloud.secure_url;
    }
    const updt = await dressModel.findByIdAndUpdate(
      id,
      {
        color,
        size,
        brandIcon,
        brandName,
        realPrize,
        prize,
        image,
        category,
        name,
      },
      { new: true, runValidators: true },
    );

    res.status(201).json(updt);
  } catch (error) {
    console.log("error in update dress", error);
    res.status(500).json({ message: error });
  }
};

//get all dres///////////////////
const getallDress = async (req, res) => {
  try {
    const getAllDressData = await dressModel.find();
    res.status(201).json(getAllDressData);
  } catch (error) {
    console.log("error in get all dress data", error);
    res.status(500).json({ message: error });
  }
};

// get dress by category
const getDressByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const getproduct = await dressModel.find({ category });
    res.status(200).json(getproduct);
  } catch (error) {
    console.log("error in get product by category", error);

    res.status(500).json({ message: error.message });
  }
};

//delete dress
const deleteDress = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteDress = await dressModel.findByIdAndDelete(id);
    res.status(200).json("deleted successfully");
  } catch (error) {
    console.log("error in delete dress");
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDress,
  updateDress,
  getallDress,
  getDressByCategory,
  deleteDress,
};
