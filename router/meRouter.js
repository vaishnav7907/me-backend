const express = require("express");

const upload = require("../utility/multer");
const {
  createDress,
  getProducts,
  updateProducts,
  deleteProduct,
} = require("../controller/dressController/dressController");
// const {
//   userSignUp,
//   adminSignUp,
//   userAdminLogin,
// } = require("../controller/authController/userAdminAuthentication/authenticationController");
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
const {
  getShirtsByCategory,
} = require("../controller/getProductsByCategory/GetProductsByCategory");
const settingMiddleware = require("../middleware/middleware");
const {
  createCheckout,
} = require("../controller/checkoutController/checkoutController");
const {
  userSignUp,
  adminSignUp,
  userAdminLogin,
} = require("../controller/authController/userAdminAuthentication/authenticationController");
const {
  createRazorpayOrder,
} = require("../controller/payment/razorpayController/razorpayController");
const { verifyRazorpayPayment } = require("../controller/payment/verifyRezorPay/verifyRezorPay");
const { getAdminOrders, updateOrderStatus, bulkUpdateOrderStatus } = require("../controller/orderConfirmation/orderConfirmationController");

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

router.post(
  "/createBrand",
  upload.fields([
    {
      name: "brandIcon",
      maxCount: 1,
    },
    {
      name: "brandImage",
      maxCount: 1,
    },
  ]),
  createBrand,
);

// get brand

router.get("/getBrand", getBrands);

// update brands

router.patch(
  "/updateBrands/:id",
  upload.fields([
    {
      name: "brandIcon",
      maxCount: 1,
    },
    {
      name: "brandImage",
      maxCount: 1,
    },
  ]),
  updateBrands,
);

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

// checkout section

router.post("/Checkout", settingMiddleware, createCheckout);

// razorpay payment

router.post("/createRazorpayOrder", createRazorpayOrder);

router.post("/verifyRazorpayPayment",verifyRazorpayPayment)


// order status

router.get("/getAdminOrder",getAdminOrders)
router.patch("/updateOrderStatus",settingMiddleware,updateOrderStatus)
router.patch("/bulkUpdateOrderStatus",settingMiddleware,bulkUpdateOrderStatus)

module.exports = router;
