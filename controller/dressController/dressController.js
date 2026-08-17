const dressModel = require("../../model/dress/dress");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const sharp = require("sharp");
const streamFier = require("streamifier");
///create dress //////////////////////

const createDress = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);
    const {
      Name,
      category,
      price,
      realPrice,
      brandName,
      brandIcon,
      color,
      colorCode,
      sizes,
    } = req.body;

    if (!req.files) {
      return res.status(400).json({
        message: "Image is required",
      });
    }

    if (!color || !colorCode) {
      return res
        .status(400)
        .json({ message: "Color and color code are required" });
    }

    if (!sizes) {
      return res.status(400).json({ message: "Sizes are required" });
    }

    // Convert sizes from string to array
    //when size send from frontend to backend an string array. means '[{"size":"S","stock":10},{"size":"M","stock":20},{"size":"L","stock":15}]' so here we wnat to converts to an array

    let parsedSizes;

    try {
      parsedSizes = JSON.parse(sizes); //JSON.parse() is used to convert a JSON string into a JavaScript value (object, array, etc.).
      console.log("parsed sizes", parsedSizes);
    } catch (error) {
      return res.status(400).json({ message: "Invalid sizes format" });
    }

    let uploadedImage = [];

    console.log("uploaded image", uploadedImage);

    for (const file of req.files) {
      // for (const file of req.file) used for , here we uploading multiple files so thee files remain in an array. here for (const file of req.file)file is means a file from from array of file. take a file for here we using sharp need particular image data to optimize .
      const imageBuffer = file.buffer;

      console.log("img buffer", imageBuffer);

      // optimize image

      const optimizedImg = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      console.log("optimize image", optimizedImg);

      //upload media to cloudinary

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder:"Me/Dresses",
          },

          (error, result) => {
            if (error) {
              console.log("cloudinary error", error);

              reject(error);
            } else {
              console.log("UPLOAD SUCCESS:", result);
              resolve(result);
            }

            // if (error) return reject(error);
            // resolve(result);
          },
        );
        streamFier.createReadStream(optimizedImg).pipe(uploadStream);

        console.log("streamifier", streamFier);

        console.log("upload stream", uploadStream);
      });

      console.log("resulttt", result);

      uploadedImage.push(result.secure_url); //this gives after upload a url. and when create it it shows in mongodb
    }

    //create variants
    const variants = [
      {
        color: {
          name: color,
          code: colorCode,
        },

        images: uploadedImage,
        sizes: parsedSizes,
      },
    ];

    console.log("varients...", variants);

    const createDressData = await dressModel.create({
      Name,
      category,
      price,
      realPrice,
      brandName,
      brandIcon,
      variants,
    });

    console.log("createdress", createDressData);
    res.status(201).json(createDressData);
  } catch (error) {
    console.log("error in create dress", error);
    res.status(500).json({ message: error.message });
  }
};

///update dres///////////////////////

const updateDress = async (req, res) => {
  try {
    const {
      name,
      price,
      realPrice,
      brandName,
      brandIcon,
      color,
      colorCode,
      sizes,
    } = req.body;

    const { id } = req.params;

    const product = await dressModel.findById(productid);
    if (!product) {
      return res.status(404).json({
        message: "dress not found",
      });
    }

    const variant = product.variants.id(variantid);
    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    let parsedsizes;

    try {
      parsedsizes = JSON.parse(sizes);
    } catch (error) {
      return res.status(400).json({ message: "Invalid sizes format" });
    }
    // default old image
    let uploadedimage = [];

    if (existingDessData.variants && existingDessData.variants.length > 0) {
      uploadedimage = existingDessData.variants[0].images || [];
    }

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
            folder: "ME/dresses",
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
