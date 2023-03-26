import userModel from "../model/userModel.js";
import productModel from "../model/productModel.js";
import categoryModel from "../model/categoryModel.js";
import couponModel from "../model/couponModel.js";
import moment from "moment-timezone";
import upload from "../middlewares/multer.js";
import bcrypt from "bcryptjs";
import orderModel from "../model/orderModel.js";
import { Chart } from "chart.js";
import fs from 'fs'


let isLoggedInAdmin;
let adminloginError;
let categoryExistError;
let couponExistError;
export async function adminLogin(req, res) {
  try {
    // res.json({message:"admin loginPage"})
    if (req.session.admin) {
      let userData = await userModel.find().lean();
      let productData = await productModel.find().lean();

      res.redirect("/admin/home");
    } else {
      res.render("admin/login", { adminloginError });
      adminloginError = null;
    }
  } catch (error) {
    console.error("Error getting admin loginpage:", error);
    res.status(500).send("Internal server error");
  }
}

// export async function adminProfile(req,res){
//     // res.json({message:"admin loginPage"})
//     res.render('admin/pagesProfile')
// }

export async function postAdminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await userModel.findOne({ email: email, isAdmin: true });
    console.log("admin:" + admin);
    if (admin) {
      if (bcrypt.compareSync(password, admin.password)) {
        isLoggedInAdmin = true;
        req.session.admin = {
          id: admin._id,
        };

        res.redirect("/admin");
      } else {
        adminloginError = "Credentials not match";
        console.log("pass error");
        res.redirect("/admin");
      }
    } else {
      res.redirect("/admin");
      console.log("email error");
      adminloginError = "Not registered";
    }
  } catch (error) {
    console.error("Error submitting admin login:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getHome(req, res) {
  try {
    if (req.session.admin) {
      let userData = await userModel.find().lean();
      let productData = await productModel.find().lean();
      //
      const orders = await orderModel.find().lean();
      const monthlyDataArray= await orderModel.aggregate([{$match:{orderStatus:"delivered"}},{$group:{_id:{$month:"$createdAt"}, sum:{$sum:"$total"}}}])
      let totalOrders = orders.length;
      let totalRevenue = 0;
      let totalPending = 0;
      let deliveredOrders = orders.filter((item) => {
        if (item.orderStatus == "pending" || item.orderStatus == 'shipped') {
          totalPending++;
        }
        if(item.orderStatus == "delivered"){
            totalRevenue = totalRevenue + item.total;
        }
        return item.orderStatus=='delivered';
      });
      let totalDispatch = deliveredOrders.length;
      let 
      monthlyDataObject={}
      monthlyDataArray.map(item=>{
        monthlyDataObject[item._id]=item.sum
      })
      let monthlyData=[]
      for(let i=1; i<=12; i++){
          monthlyData[i-1]= monthlyDataObject[i] ?? 0
        }
    
     
      //
      res.render("admin/index", { userData, productData,monthlyData, totalOrders,totalRevenue,totalPending,totalDispatch});
      console.log(monthlyData,'mdta');
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.error("Error getting homepage:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getDashboard(req, res) {
  res.redirect("/admin/home");
}

//salesReport
export async function getSalesReport(req, res) {

  let startDate = new Date(new Date().setDate(new Date().getDate() - 8))
  let endDate = new Date()
  
  if(req.query.startDate){
      startDate = new Date(req.query.startDate)
      startDate.setHours(0, 0, 0, 0);
  }
  if(req.query.endDate){
      endDate = new Date(req.query.endDate)
      endDate.setHours(24, 0, 0, 0);
  }
  if(req.query.filter=='thisYear'){
    let currentDate= new Date()
    startDate= new Date(currentDate.getFullYear(), 0, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate= new Date(new Date().setDate(new Date().getDate() +1 ))
    endDate.setHours(0, 0, 0, 0);
  }

  
  if(req.query.filter=='thisMonth'){
    let currentDate= new Date()
    startDate= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);
    endDate= new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1);
    endDate.setHours(0, 0, 0, 0);
  }
 
const orders = await orderModel
  .find({createdAt: { $gt: startDate, $lt: endDate }})
  .sort({ createdAt: -1 })
  .lean();
  console.log(orders[0],'ooooooo');
let totalOrders = orders.length;
let totalRevenue = 0;
let totalPending = 0;
let deliveredOrders = orders.filter((item) => {

  if (item.orderStatus == "pending" || item.orderStatus == 'shipped') {
    totalPending++;
  }else{
    
      totalRevenue = totalRevenue + item.total;
      return item;

  }
});
let totalDispatch = deliveredOrders.length;
console.log(totalDispatch,"tddddd");

let orderTable=[]
orders.map(item=>{
  orderTable.push([item.product[0].title, item.total, item.orderStatus, item.quantity, item.createdAt.toLocaleDateString() ])
})
console.log(orderTable,"hhhhhh");

let filter=req.query.filter ?? "";
if(!req.query.filter && !req.query.startDate){
  filter="lastWeek"
}
res.render("admin/salesReport", {
  orders,
  totalDispatch,
  totalOrders,
  totalPending,
  totalRevenue,
  startDate:moment(new Date(startDate).setDate(new Date(startDate).getDate() + 1)).utc().format('YYYY-MM-DD'),
  endDate:moment(endDate).utc().format('YYYY-MM-DD'),
  orderTable,

  
  filter
});
}
//

export async function adminLogout(req, res) {
  req.session.admin = null;
  // res.json({message:"admin loginOut"})
  res.redirect("/admin");
}

//user management

// export async function getAddUser(req,res){
//     res.json({message:"Add User page"})
// }

// export async function postAddUser(req,res){
//     const {name,email,password}=req.body
//     const exiUser=await userModel.findOne({email})
//     if(!exiUser){
//         const user=new userModel({name,email,password})
//         user.save()
//         res.json({message:'user added redirecting to dashboard'})
//     }else{
//         res.json({message:"user already exists"})
//     }
// }

export async function getUserManage(req, res) {
  try {
    let userData = await userModel.where("isAdmin").equals(false).lean();
    res.render("admin/userManage", { userData });
  } catch (error) {
    console.error("Error getting user manage page:", error);
    res.status(500).send("Internal server error");
  }
}
export async function blockUser(req, res) {
  const { id } = req.params;
  await userModel.findByIdAndUpdate(id, { $set: { block: true } });
  res.redirect("/admin/userManage");
  //    console.log(productData);
}
export async function unblockUser(req, res) {
  const { id } = req.params;
  await userModel.findByIdAndUpdate(id, { $set: { block: false } });
  res.redirect("/admin/userManage");
  //    console.log(productData);
}

export async function getAllUser(req, res) {
  let userData = await userModel.find();
}

// export async function postEditUser(req,res){
//     const {id}=req.params
//     const user =await userModel.findOne({id})
//     const updateduser = await userModel.updateOne({id},req.body)
//     // res.json(updateduser)
// }

// export async function deleteUser(req,res){
//     const deletedUser= await userModel.findOneAndDelete({_id:req.params.id})
//     res.json(deletedUser)
// }

//product management

export async function getProductManage(req, res) {
  let productData = await productModel.find().populate('category').lean()
  // const categoryData=await categoryModel.find().lean()
  res.render("admin/productManage", { productData });
}

export async function getAllProducts(req, res) {
  let productData = await productModel.find().lean();
  //    console.log(productData);
}

export async function getAddProduct(req, res) {
  let categoryData = await categoryModel.find().lean();
  res.render("admin/addProduct", { categoryData });
}

export async function postAddProduct(req, res) {
  // Handle form submission and create new product object
  const product = new productModel({
    title: req.body.title,
    MRP: req.body.MRP,
    price: req.body.price,
    desc: req.body.desc,
    stock: req.body.stock,
    category: req.body.category,
    mainImage: req.files.mainImage[0],
    sideImages: req.files.sideImages,
  });

  try {
    await product.save();
    res.redirect("/admin/productManage");
  } catch (err) {
    console.error(err);
    res.render({ message: "Failed to add product" });
  }
}

export async function editProductPage(req, res) {
  try {
    let id = req.params.id;
    let product = await productModel.findById(id).populate('category','name').lean();
    let categoryData = await categoryModel.find().lean();
    res.render("admin/editProduct", { product,categoryData});
  } catch (error) {
    console.error("Error rendering product page:", error);
    res.status(500).send("Internal server error");
  }
}

export async function editProduct(req, res) {
  try {
    console.log(req.files);

    const _id = req.params.id;
    const { title, category, stock, price, desc, MRP } = req.body;

    let product;
    if (req.files.mainImage && req.files.sideImages) {
      console.log("one");

      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            title,
            category,
            stock,
            price,
            desc,
            MRP,
            mainImage: req.files.mainImage[0],
            // sideImages: req.files.sideImages,
          },
          $push: { sideImages: { $each: req.files.sideImages } }
        }
      );
    }
    if (!req.files.mainImage && req.files.sideImages) {
      console.log("second");

      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            title,
            category,
            stock,
            price,
            desc,
            MRP,

            // sideImages: req.files.sideImages,
          },
          $push: { sideImages: { $each: req.files.sideImages } }
        }
      );
    }
    if (!req.files.mainImage && !req.files.sideImages) {
      console.log("thire");
      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            title,
            category,
            stock,
            price,
            desc,
            MRP,
          },
        }
      );
    }
    if (req.files.mainImage && !req.files.sideImages) {
      console.log("four");
      product = await productModel.updateOne(
        { _id },
        {
          $set: {
            title,
            category,
            stock,
            price,
            desc,
            MRP,
            mainImage: req.files.mainImage[0],
          },
        }
      );
    }
    return res.redirect("/admin/productManage");
  } catch (error) {
    console.error("Error Updating products", error);
    return res.status(500).send("Internal Server Error");
  }
}

export async function deleteProduct(req, res) {
  const deletedProduct = await productModel.findOneAndDelete({
    _id: req.params.id,
  });
  res.json(deletedProduct);
}

//category

export async function getCategoryManage(req, res) {
  try {
    let categoryData = await categoryModel.find().lean();
    res.render("admin/categoryManage", { categoryData, categoryExistError });
    categoryExistError = null;
  } catch (error) {
    console.error("Error getting category page:", error);
    res.status(500).send("Internal server error");
  }
}

export async function postAddCategory(req, res) {
  try {
    let name = req.body.name;
    let categoryExist = await categoryModel.findOne({
      name: name.toLowerCase(),
    });
    const category = new categoryModel({
      name: req.body.name.toLowerCase(),
    });
    if (!categoryExist) {
      try {
        await category.save();
        res.redirect("/admin/CategoryManage");
      } catch (err) {
        console.error(err);
      }
    } else {
      categoryExistError = "Category Exists";
      res.redirect("/admin/CategoryManage");
    }
  } catch (error) {
    console.error("Error submitting category:", error);
    res.status(500).send("Internal server error");
  }
}

export async function unlistCategory(req, res) {
  const { id } = req.params;
  await categoryModel.findByIdAndUpdate(id, { $set: { list: false } });
  res.redirect("/admin/categoryManage");
  //
}
export async function listCategory(req, res) {
  const { id } = req.params;
  await categoryModel.findByIdAndUpdate(id, { $set: { list: true } });
  res.redirect("/admin/categoryManage");
  //
}

export async function getProductByCategory(req,res){
  const {id} =req.params;
  let productByCategory = await productModel.find({category:id}).lean()
  // let categoryName = await categoryModel.find({id}).lean();

    res.render("admin/productByCategory", { productByCategory });
    console.log(productByCategory);
}

//coupon

const formatDate = function (date, format) {
  moment.locale("en");
  return moment(date).tz("Asia/Kolkata").format(format);
};
export async function getCouponManage(req, res) {
  try {
    let couponData = await couponModel.find().lean();
    res.render("admin/couponManage", {
      formatDate,
      couponData,
      couponExistError,
    });
    couponExistError = null;
  } catch (error) {
    console.error("Error getting coupon page:", error);
    res.status(500).send("Internal server error");
  }
}

export async function postAddCoupon(req, res) {
  try {
    let couponExist = await couponModel.findOne({ name: req.body.name });
    // Handle form submission and create new product object
    const coupon = new couponModel({
      name: req.body.name,
      code: req.body.code,
      discountValue: req.body.discountValue,
      minSaleValue: req.body.minSaleValue,
      expiryDate: req.body.expiryDate,
    });
    console.log("called post coupon " + coupon);
    // Save new category to database using Mongoose
    if (!couponExist) {
      try {
        await coupon.save();
        console.log("save coupon " + coupon);
        res.redirect("/admin/CouponManage");
      } catch (err) {
        console.error(err);
      }
    } else {
      couponExistError = "Coupon Exists";
      res.redirect("/admin/CouponManage");
    }
  } catch (error) {
    console.error("Error submitting coupon:", error);
    res.status(500).send("Internal server error");
  }
}

export async function unlistCoupon(req, res) {
  const { id } = req.params;
  await couponModel.findByIdAndUpdate(id, { $set: { list: false } });
  res.json({ unlist: true });
  //
}
export async function listCoupon(req, res) {
  const { id } = req.params;
  await couponModel.findByIdAndUpdate(id, { $set: { list: true } });
  res.json({ list: true }); //
}
export async function getEditCoupon(req, res) {
  try {
    let { id } = req.params;
    console.log(id);
    let coupon = await couponModel.findById(id).lean();
    console.log(coupon);
    res.render("admin/editCoupon", { formatDate, coupon });
  } catch (error) {
    console.error("Error getting Coupon page:", error);
    res.status(500).send("Internal server error");
  }
}

export async function postEditCoupon(req, res) {
  try {
    const id = req.params.id;
    let editedCoupon = await couponModel.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    console.log("postEdit" + editedCoupon);
    res.redirect("/admin/couponManage");
  } catch (error) {
    console.error("Error editing Coupon:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getOrderManage(req, res) {
  let orderData = await orderModel.find().lean()
  // const categoryData=await categoryModel.find().lean()
  res.render("admin/orderManage", { orderData });

}
export async function getOrderDetails(req, res) {
  try {
    const orderId = req.params.id;
    console.log(req.params.orderId,"OI");

    let orderData = await orderModel
      .find({ orderId: orderId })
      .lean();
    console.log("order d", orderData);
    res.render("admin/orderDetails", { orderData });
  } catch (error) {
    console.error("Error while getting product details:", error);
    res.status(500).send("Internal server error");
  }

}

export async function orderStatus (req, res) {
  const id = req.params.id;
  const orderStatus = req.body.orderStatus;
  console.log('orderId',id);

  try {
    const order = await orderModel.findByIdAndUpdate(id, { orderStatus: orderStatus }, { new: true });
    // res.json({ success: true, order });
    res.redirect('/admin/orderManage')
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export async function sideImagesDel(req, res) {
  try{
  const { filename } = req.params;
  console.log(filename);
  
  let imageSource=await productModel.updateOne({"sideImages.filename":filename},{$pull:{sideImages:{filename:filename}}})
  // await couponModel.findByIdAndUpdate(id, { $set: { list: false } });
   res.json({ data: true });
  //
  console.log(imageSource);
} catch (error) {
  console.error("Error delete side Images:", error);
  res.status(500).send("Internal server error");
}
}