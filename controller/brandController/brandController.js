const brandModel = require("../../model/brand/brand");
const sharp = require("sharp");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");
const createBrand = async (req, res) => {
  try {
    const { brandName, brandIcon, brandSlogan } = req.body;

    const uploadedImage = [];
    const imageBuffer = file.imageBuffer;
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
    }
uploadedImage.push(result.secure_url)
);
    const brandCreateFn = await brandModel.create({
      brandName,
      brandIcon,
      brandSlogan,
    });
  } catch (error) {}
};
module.exports = { createBrand };
