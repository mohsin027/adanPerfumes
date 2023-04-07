import express from "express";
import {
  adminLogin,
  adminLogout,
  blockUser,
  deleteProduct,
  editProduct,
  editProductPage,
  getAddProduct,
  getAllUser,
  getCategoryManage,
  getCouponManage,
  getDashboard,
  getEditCoupon,
  getHome,
  getOrderDetails,
  getOrderManage,
  getProductByCategory,
  getProductManage,
  getSalesReport,
  getUserManage,
  listCategory,
  listCoupon,
  orderStatus,
  postAddCategory,
  postAddCoupon,
  postAddProduct,
  postAdminLogin,
  postEditCoupon,
  sideImagesDel,
  unblockUser,
  unlistCategory,
  unlistCoupon,
} from "../controllers/adminController.js";
const router = express.Router();
import upload from "../middlewares/multer.js";
import verifyAdmin from "../middlewares/verifyAdmin.js";

router.get("/", adminLogin);
router.get("/home", getHome);
router.get("/index", verifyAdmin, getDashboard);
router.post("/index", postAdminLogin);
router.get("/logout", adminLogout);


router.get("/getUsers", verifyAdmin, getAllUser);

router.get("/productManage", verifyAdmin, getProductManage);
router.get("/userManage", verifyAdmin, getUserManage);
router.get("/blockUser/:id", verifyAdmin, blockUser);
router.get("/unblockUser/:id", verifyAdmin, unblockUser);

router.get("/categoryManage", verifyAdmin, getCategoryManage);
router.get("/unlistCategory/:id", verifyAdmin, unlistCategory);
router.get("/listCategory/:id", verifyAdmin, listCategory);
router.get("/getProductByCategory/:id", verifyAdmin, getProductByCategory);
router.post("/addCategory", verifyAdmin, postAddCategory);



router.post("/addCoupon", verifyAdmin, postAddCoupon);
router.get("/couponManage", verifyAdmin, getCouponManage);
router.get("/salesReport", verifyAdmin, getSalesReport);
router.get("/unlistCoupon/:id", verifyAdmin, unlistCoupon);
router.get("/listCoupon/:id", verifyAdmin, listCoupon);
router.get("/editCoupon/:id", verifyAdmin, getEditCoupon);
router.post("/editCoupon/:id", verifyAdmin, postEditCoupon);

router.get("/addProduct", verifyAdmin, getAddProduct);
router.post(
  "/addProduct",
  upload.fields([
    { name: "sideImages", maxCount: 12 },
    { name: "mainImage", maxCount: "1" },
  ]),
  verifyAdmin,
  postAddProduct
);
router.get("/editProduct/:id", verifyAdmin, editProductPage);
router.post(
  "/editProduct/:id",
  upload.fields([
    { name: "sideImages", maxCount: 12 },
    { name: "mainImage", maxCount: "1" },
  ]),
  verifyAdmin,
  editProduct
);
router.delete("/deleteProduct/:id", verifyAdmin, deleteProduct);
router.get("/orderManage", verifyAdmin, getOrderManage);
router.get("/orderDetails/:id", verifyAdmin, getOrderDetails);
router.post("/orders/:id", verifyAdmin, orderStatus);

router.get("/sideImageDel/:filename", verifyAdmin, sideImagesDel);

export default router;
