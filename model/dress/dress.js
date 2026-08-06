const mongoose = require("mongoose")

const dressShema= new mongoose.Schema({
    name:{type:String,required:true, default:""},
    category:{type:String ,required:true, enum:["Shirts", "Pants", "Jackets", "Innerwear","Shorts", "T-Shirts"] ,default:""},
    image:{type:String, required:true,default:""},
    prize:{type:String, default:""},
    realPrize:{type:String,required:true, default:""},
    brand:{type:String,required:true, default:""},
    size:{type:String, default:""},
    color:{type:String, default:""},
},{timestamps:true})

const dressmodel= mongoose.model("All_Shirts",dressShema)
module.exports=dressmodel