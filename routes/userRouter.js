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
  getOrderHistory
} from "../controllers/userController.js";
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
router.get("/cart",verifyUser, getCartPage);
router.get("/getProductByCategory/:id", getProductByCategory);


router.post("/login", userLogin);
router.post("/signup", signup);
router.post("/otpSubmitSignup", signupOtp);

router.post("/emailSubmit", emailCheckResetPassword);
router.post("/otpSubmit", verifyOTP);
router.post("/passwordSubmit", resetPassword);




router.get("/addToCart/:id", verifyUser, addToCart);
router.get("/deleteFromCart/:id", verifyUser, deleteFromCart);
router.get("/addQuantity/:id",verifyUser, addQuantity);
router.get("/minusQuantity/:id",verifyUser,minusQuantity);
router.post("/checkout", verifyUser, checkout);
router.post("/addAddress", verifyUser, addToAddress);
router.post("/proceedToPayment", verifyUser, proceedToPayment);
router.get("/shop",verifyUser, shop);
router.get("/orderHistory",verifyUser, getOrderHistory);

export default router;
