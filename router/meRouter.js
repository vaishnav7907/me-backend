const express = require("express");

const upload = require("../utility/multer");
const {
  createDress,
  getProducts,
  updateProducts,
  deleteProduct,
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
  updateBrands,
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

// update products
router.patch("/updateProduct/:id",upload.array("images",10),updateProducts)

// get new Arrivals
router.get("/NewArrivals", getNewArrivals);

// brand

// create brand

router.post("/createBrand", upload.single("brandIcon"), createBrand);

// get brand

router.get("/getBrand",getBrands)

// update brands

router.patch("/updateBrands/:id",upload.single("brandIcon"),updateBrands)

router.delete("/deleteProduct/:id",deleteProduct)

module.exports = router;
