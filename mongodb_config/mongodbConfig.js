const mongoose= require("mongoose")

const connection= async ()=>{
    try {
       const connect= await mongoose.connect(process.env.MONGODB_URL)
       console.log("successfully connected to mongodb");
        
    } catch (error) {
        console.log("error in connection with mongodb",error);
        process.exit()
    }
}
module.exports=connection