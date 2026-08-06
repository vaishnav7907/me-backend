const express = require("express")
const dotenv = require("dotenv")
const connection = require("./mongodb_config/mongodbConfig")
const router = require("./router/meRouter")
dotenv.config()
const app=express()


connection()
app.use(express.json())
app.use("/Me",router)
const PORT=process.env.PORT
app.listen(PORT,()=>{console.log(`server is running on ${PORT}`);
})