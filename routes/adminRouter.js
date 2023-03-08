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
  getProductByCategory,
  getProductManage,
  getUserManage,
  listCategory,
  listCoupon,
  postAddCategory,
  postAddCoupon,
  postAddProduct,
  postAdminLogin,
  postEditCoupon,
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
// router.get("/pages-profile", adminProfile);

router.use(verifyAdmin);
// router.get('/addUser',getAddUser)
// router.post('/addUser',postAddUser)
// router.post('/editUser/:id',postEditUser)
// router.delete('/deleteUser/:id',deleteUser)

router.get("/getUsers", getAllUser);

router.get("/productManage", getProductManage);
router.get("/userManage", getUserManage);
router.get("/blockUser/:id", blockUser);
router.get("/unblockUser/:id", unblockUser);

router.get("/categoryManage", getCategoryManage);
router.get("/unlistCategory/:id", unlistCategory);
router.get("/listCategory/:id", listCategory);
router.get("/getProductByCategory/:id", getProductByCategory);


// router.get('/addCategory',getAddCategory)
// router.get('/getCategory/:category',getCategory)
router.post("/addCategory", postAddCategory);

router.post("/addCoupon", postAddCoupon);
router.get("/couponManage", getCouponManage);
router.get("/unlistCoupon/:id", unlistCoupon);
router.get("/listCoupon/:id", listCoupon);
router.get("/editCoupon/:id", getEditCoupon);
router.post("/editCoupon/:id", postEditCoupon);

router.get("/addProduct", getAddProduct);
router.post(
  "/addProduct",
  upload.fields([
    { name: "sideImages", maxCount: 12 },
    { name: "mainImage", maxCount: "1" },
  ]),
  postAddProduct
);
router.get("/editProduct/:id", editProductPage);
router.post(
  "/editProduct/:id",
  upload.fields([
    { name: "sideImages", maxCount: 12 },
    { name: "mainImage", maxCount: "1" },
  ]),
  editProduct
);
router.delete("/deleteProduct/:id", deleteProduct);

export default router;
