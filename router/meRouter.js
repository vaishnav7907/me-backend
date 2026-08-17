const express = require("express")
const { createNewArrivals, updateNewArrivals, getNewArrivals, deleteNewArrivals } = require("../controller/newarrivalController/newArrivalsController")
const upload= require("../utility/multer")
const { createDress } = require("../controller/dressController/dressController")
const router=express.Router()


// new arrival start//////////////
router.post("/createNewArrival",upload.single("image"),createNewArrivals)
router.patch("/updateNewArrivals/:id",updateNewArrivals)
router.get("/getNewArrivals",getNewArrivals)
router.delete("/deleteNewArrivals/:id",deleteNewArrivals)
//new arrival end/////////////////


//dress route

// createdress
router.post("/createDress" ,upload.array("images",10) ,createDress)


module.exports=router