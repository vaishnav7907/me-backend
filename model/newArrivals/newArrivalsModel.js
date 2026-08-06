const mongoose = require("mongoose");

const latestShrtSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    category: { type: String, default: "" },
    image: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { timestamps: true },
);

const latestshirtModel = mongoose.model("latest_shirt", latestShrtSchema);
module.exports = latestshirtModel;