const mongoose = require("mongoose");

const latestShrtSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Shirts", "Pants", "Jackets"],
      required: true,
    },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

const latestshirtModel = mongoose.model("latest_shirt", latestShrtSchema);
module.exports = latestshirtModel;
