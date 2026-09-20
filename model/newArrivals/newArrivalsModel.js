const mongoose = require("mongoose");

const latestShrtSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Shirts", "Pants", "Jackets", "Innerwear", "Shorts", "T-Shirts"],
      required: true,
    },
    arrivalsCategoryImage: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },
    },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

const latestshirtModel = mongoose.model("latest_shirt", latestShrtSchema);
module.exports = latestshirtModel;
