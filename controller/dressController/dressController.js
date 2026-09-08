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
      name,
      description,
      category,
      price,
      realPrice,
      brandName,
      brandIcon,
      variants,
      sku,
      status,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image is required",
      });
    }

    if (!variants) {
      return res.status(400).json({
        message: "Variants are required",
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
        variant.sizes.reduce(
          (sizeTotal, size) => sizeTotal + size.stock,
          0
        ),
      0
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
      brandName,
      brandIcon,
      variants: finalVariants,
    });

    console.log("CREATED DRESS:", createDressData);

    return res.status(201).json({
      message: "Product created successfully",
      product: createDressData,
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
    const products = await dressModel.find().sort({ createdAt: -1 });
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
  getProducts,
  updateDress,
  getDressByCategory,
  deleteDress,
};
