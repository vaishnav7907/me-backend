const express = require("express")
const { createNewArrivals, updateNewArrivals, getNewArrivals, deleteNewArrivals } = require("../controller/newarrivalController/newArrivalsController")

const router=express.Router()


// new arrival start//////////////
router.post("/createNewArrival",createNewArrivals)
router.patch("/updateNewArrivals/:id",updateNewArrivals)
router.get("/getNewArrivals",getNewArrivals)
router.delete("/deleteNewArrivals/:id",deleteNewArrivals)
//new arrival end/////////////////


module.exports=router