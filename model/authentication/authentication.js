const mongoose = require("mongoose");

const authSchema = new mongoose.Schema({
  FullName: { type: String, required: true, unique: true },
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  role:{type:String,enum:["user","admin"],default:"user"},
  phone: { type: String, default: "", },
});

const authModel = mongoose.model("Authentication",authSchema)

module.exports=authModel