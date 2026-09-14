const express = require("express");

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
const {
  getNewArrivals,
} = require("../controller/newarrivalController/newArrivalsController");
const {
  createBrand,
  getBrands,
} = require("../controller/brandController/brandController");
const router = express.Router();

// authentication user and admin
router.post("/userSignup", userSignUp);
router.post("/adminSignup", adminSignUp);

router.post("/userAdminLogin", userAdminLogin);
///////--------------------------

//dress route

// createdress
router.post("/createDress", upload.array("images", 10), createDress);

// get products

router.get("/getProducts", getProducts);

// get new Arrivals
router.get("/NewArrivals", getNewArrivals);

// brand

// create brand

router.post("/createBrand", upload.single("brandIcon"), createBrand);

// get brand

router.get("/getBrand",getBrands)

module.exports = router;
