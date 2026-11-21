const mongoose = require("mongoose");

const welcomePageSchema = new mongoose.Schema(
  {
    welcomeImage: {
      url: {
        type: String,
        default: "",
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true },
);

const WelcomePageModel = mongoose.model("welcomeImage", welcomePageSchema);

module.exports = WelcomePageModel;
