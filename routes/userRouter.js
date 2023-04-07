import express from "express";
import {
  addQuantity,
  addToCart,
  deleteFromCart,
  emailCheckResetPassword,
  getCartPage,
  getOtpPage,
  getProductByCategory,
  getProductPage,
  getResetPage,
  getSignupOtp,
  getUserForgetPassPage,
  getUserHomePage,
  getUserLoginPage,
  getUserLogout,
  getUserSignupPage,
  resetPassword,
  signup,
  signupOtp,
  userLogin,
  verifyOTP,
  minusQuantity,
  checkout,
  addToAddress,
  proceedToPayment,
  shop,
  getOrderHistory,
  couponValidation,
  getUserPayment,
  getProfile,
  getOrderDetails,
  deleteAddress,
  getEditAddress,
  editAddress,
  // getCheckout,
} from "../controllers/userController.js";
import checkUser from "../middlewares/checkUser.js";
import verifyUser from "../middlewares/verifyUser.js";
const router = express.Router();

router.get("/login", getUserLoginPage);
router.get("/signup", getUserSignupPage);
router.get("/signupOtp", getSignupOtp);
router.get("/", getUserHomePage);
router.get("/logout", getUserLogout);
router.get("/forgetPassword", getUserForgetPassPage);
router.get("/getOtpPage", getOtpPage);
router.get("/getResetPage", getResetPage);
router.get("/productPage/:id", getProductPage);
router.get("/getProductByCategory/:id", getProductByCategory);

router.post("/signup", signup);
router.post("/otpSubmitSignup", signupOtp);

router.post("/emailSubmit", emailCheckResetPassword);
router.post("/otpSubmit", verifyOTP);
router.post("/passwordSubmit", resetPassword);

router.get("/shop", shop);

router.use(checkUser);
router.post("/login", userLogin);
router.get("/cart", verifyUser, getCartPage);
router.get("/addToCart/:id", verifyUser, addToCart);
router.get("/deleteFromCart/:id", verifyUser, deleteFromCart);
router.get("/addQuantity/:id", verifyUser, addQuantity);
router.get("/minusQuantity/:id", verifyUser, minusQuantity);
router.get("/checkout", verifyUser, checkout);
router.post("/addAddress", verifyUser, addToAddress);
router.post("/proceedToPayment", verifyUser, proceedToPayment);
router.post("/couponValidation", verifyUser, couponValidation);
router.get("/orderHistory", verifyUser, getOrderHistory);
router.get("/orderDetails/:orderId", verifyUser, getOrderDetails);
router.get("/verifyPayment", verifyUser, getUserPayment);
router.get("/profile", verifyUser, getProfile);
router.get("/editProfile/:id", verifyUser, getEditAddress);
router.post("/editProfile/:id", verifyUser, editAddress);
router.get("/deleteAddress/:id", verifyUser, deleteAddress);

export default router;
