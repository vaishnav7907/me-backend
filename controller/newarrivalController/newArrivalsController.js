const newArrivalModel = require("../../model/newArrivals/newArrivalsModel");
const cloudinary = require("../../cloudinary/cloudinaryConfig");
const streamiFier = require("streamifier");
const sharp = require("sharp");
const createNewArrivals = async (req, res) => {
  try {
    const { description, category, name } = req.body;
    if (!req.file) {
      return res.status(404).json({ message: "image is required" });
    }
    const imageBuffer = req.file.buffer;

    const optimizeImg = await sharp(imageBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    const uploadnewArrivalImg = await new Promise((resolve, reject) => {
      const uploadImage = cloudinary.uploader.upload_stream(
        {
          folder: "ME/NewArrivals",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      streamiFier.createReadStream(optimizeImg).pipe(uploadImage);
    });
    const image = uploadnewArrivalImg.secure_url;
    const createnew = await newArrivalModel.create({
      description,
      image,
      category,
      name,
    });

    res.status(201).json(createnew);
  } catch (error) {
    console.log(" error in create new ariivals :", error);
    res.status(500).json({ error: "iinternal server error" });
  }
};

const updateNewArrivals = async (req, res) => {
  try {
    const { description, category, name } = req.body;
    const { id } = req.params;
    const existnewarrival = await newArrivalModel.findById(id);

    if (!existnewarrival) {
      return res.status(404).json({ message: "new arrivals didnt exist" });
    }

    let image = existnewarrival.image;

    if (req.file) {
      const imageBuffer = req.file.buffer;

      const optimizeimage = await sharp(imageBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const newArrivalsUpdtTocloud = await new Promise((resolve, reject) => {
        const toCloudinary = cloudinary.uploader.upload_stream(
          { folder: "Me/NewArrivals" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        streamiFier.createReadStream(optimizeimage).pipe(toCloudinary);
      });

      image = newArrivalsUpdtTocloud.secure_url;
    }

    const updtnewarrival = await newArrivalModel.findByIdAndUpdate(
      id,
      { description, image, category, name },
      { new: true, runValidators: true },
    );

    res.status(201).json(updtnewarrival);
  } catch (error) {
    console.log("error in updt new arrival", error);
    res.status(500).json(error);
  }
};

const getNewArrivals = async (req, res) => {
  try {
    const getallnewarrivals = await newArrivalModel.find();
    res.status(201).json(getallnewarrivals);
  } catch (error) {
    console.log("error in get all new arrivals", error);
    res.status(500).json(error);
  }
};

const deleteNewArrivals = async (req, res) => {
  try {
    const { id } = req.params;
    const dltnewArrivals = await newArrivalModel.findByIdAndDelete(id);
    res.status(200).json({ message: "successfully deleted" });
  } catch (error) {
    console.log("error in deletion of new arrivals", error);
    res
      .status(500)
      .json({ message: "error in deletetion of new arrivals", data: error });
  }
};
module.exports = {
  createNewArrivals,
  updateNewArrivals,
  getNewArrivals,
  deleteNewArrivals,
};
