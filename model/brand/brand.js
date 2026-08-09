const mongoose = require("mongoose")

const brandSchema= new mongoose.Schema({
    brandName:{type:String, required:true, default:""},
    brandIcon:{type:String, required:true, default:""},
    brandSlogan:{type:String, required:true, default:""}
},{timestamps:true})

const brandModel= mongoose.model("brand",brandSchema)
module.exports=brandModel

