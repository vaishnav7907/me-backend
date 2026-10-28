const mongoose = require("mongoose");

const cartItemsSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "dress",
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },

    items: [cartItemsSchema],
  },
  {
    timestamps: true,
  },
);

const  cartSchemaModel= mongoose.model("cart",cartSchema)
module.exports=cartSchemaModel
