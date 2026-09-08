const express = require("express");
const {
  createNewArrivals,
  updateNewArrivals,
  getNewArrivals,
  deleteNewArrivals,
} = require("../controller/newarrivalController/newArrivalsController");
const upload = require("../utility/multer");
const {
  createDress,
  getProducts,
} = require("../controller/dressController/dressController");
const {
  userSignUp,
  adminSignUp,
  userAdminLogin,
} = require("../controller/authController/authenticationController");
const router = express.Router();

// authentication user and admin
router.post("/userSignup", userSignUp);
router.post("/adminSignup", adminSignUp);

router.post("/userAdminLogin",userAdminLogin)
///////--------------------------


// new arrival start//////////////
router.post("/createNewArrival", upload.single("image"), createNewArrivals);
router.patch("/updateNewArrivals/:id", updateNewArrivals);
router.get("/getNewArrivals", getNewArrivals);
router.delete("/deleteNewArrivals/:id", deleteNewArrivals);
//////-----------------------------

//dress route

// createdress
router.post("/createDress", upload.array("images", 10), createDress);

// get products

router.get("/getProducts",getProducts)

module.exports = router;
