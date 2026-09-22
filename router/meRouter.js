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
  createLatestArrivals,
  getLatestArrivals,
  deleteLatestArrivals,
  updateLatestArrivals,
} = require("../controller/newarrivalController/newArrivalsController");
const {
  createBrand,
  getBrands,
  updateBrands,
  deleteBrands,
} = require("../controller/brandController/brandController");
const { getShirtsByCategory } = require("../controller/getProductsByCategory/GetProductsByCategory");

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
router.patch("/updateProduct/:id", upload.array("images", 10), updateProducts);

// delete product

router.delete("/deleteProduct/:id", deleteProduct);

// get new Arrivals
router.get("/NewArrivals", getNewArrivals);

// brand

// create brand

router.post("/createBrand", upload.single("brandIcon"), createBrand);

// get brand

router.get("/getBrand", getBrands);

// update brands

router.patch("/updateBrands/:id", upload.single("brandIcon"), updateBrands);

// delete brands

router.delete("/deleteBrand/:id", deleteBrands);

// latest arrivals

router.post(
  "/createLatestArrivals",
  upload.single("latestArrivals"),
  createLatestArrivals,
);

// get latest arrivals

router.get("/latestArrivals", getLatestArrivals);

// delete latest arrivals

router.delete("/deleteLatestArrivals/:id", deleteLatestArrivals);
// update latest arrivals

router.patch(
  "/updateLatestArrivals/:id",
  upload.single("latestArrivals"),
  updateLatestArrivals,
);

// get products by category

router.get("/getProductsByCategory/:category", getShirtsByCategory);
module.exports = router;
