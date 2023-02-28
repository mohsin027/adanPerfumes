import userModel from "../model/userModel.js"
import productModel from "../model/productModel.js"
import categoryModel from "../model/categoryModel.js";
import couponModel from "../model/couponModel.js";
import moment from "moment-timezone";
import upload from "../middlewares/multer.js";


let isLoggedInAdmin
let adminloginError;
let categoryExistError;
let couponExistError;
export async function adminLogin(req,res){
    // res.json({message:"admin loginPage"})
    if(req.session.admin){
      let userData = await userModel.find().lean()
      let productData = await productModel.find().lean()
      
  res.render("admin/index", {userData,productData});
    }else{
    res.render('admin/login',{ adminloginError })
    adminloginError=null
}}
export async function adminProfile(req,res){
    // res.json({message:"admin loginPage"})
    res.render('admin/pages-profile')
}

export async function postAdminLogin(req, res, next) {
    const { email, password } = req.body;
    const admin = await userModel.findOne({ email:email,isAdmin:true });
    console.log("admin:" + admin);
    if (admin) {
        if (password == admin.password) {
            isLoggedInAdmin = true;
            req.session.admin = {
                id: admin._id,
            };
            
            
        res.redirect("/admin");
      } else {
        adminloginError="Credentials not match"
        console.log('pass error');
        res.redirect("/admin");
      }
    } else {
      res.redirect("/admin");
      console.log('email error');
      adminloginError="Not registered"
    }
    console.log(req.session.admin);
  }

export async function getHome(req,res){
   if(req.session.admin){
        let userData = await userModel.find().lean()
            let productData = await productModel.find().lean()
            
        res.render("admin/index", {userData,productData});
    }else{
         res.redirect('/admin')
     } 
}

export async function getDashboard(req,res){
    res.redirect('/admin/home')
}


export async function adminLogout(req,res){
    req.session.admin=null
    // res.json({message:"admin loginOut"})
    res.redirect('/admin')
}


//user management
export async function getAddUser(req,res){
    res.json({message:"Add User page"})
}

export async function postAddUser(req,res){
    const {name,email,password}=req.body
    const exiUser=await userModel.findOne({email})
    if(!exiUser){
        const user=new userModel({name,email,password})
        user.save()
        res.json({message:'user added redirecting to dashboard'})
    }else{
        res.json({message:"user already exists"})
    }  
}

export async function getUserManage(req,res){
  let userData = await userModel.where("isAdmin").equals(false).lean()
    res.render('admin/userManage',{userData})
 //    console.log(productData);
 }
export async function blockUser(req,res){
  const {id}=req.params
await userModel.findByIdAndUpdate(id,{$set:{block:true}})
    res.redirect('/admin/userManage')
 //    console.log(productData);
 }
export async function unblockUser(req,res){
  const {id}=req.params
await userModel.findByIdAndUpdate(id,{$set:{block:false}})
    res.redirect('/admin/userManage')
 //    console.log(productData);
 }

export async function getAllUser(req,res){
   let userData = await userModel.find()
}

export async function postEditUser(req,res){
    const {id}=req.params
    const user =await userModel.findOne({id})
    const updateduser = await userModel.updateOne({id},req.body)
    // res.json(updateduser)
}


export async function deleteUser(req,res){
    const deletedUser= await userModel.findOneAndDelete({_id:req.params.id})
    res.json(deletedUser)
}


 //product management


 export async function getProductManage(req,res){
    let productData = await productModel.find().lean()
    console.log(productData);
    res.render('admin/productManage',{productData})
    console.log(productData.mainImage);
 }

 export async function getAllProducts(req,res){
    let productData = await productModel.find().lean()
 //    console.log(productData);
 }

 export async function getAddProduct(req,res){
  let categoryData=await categoryModel.find().lean()
    res.render('admin/addProduct',{categoryData})
}


export async function postAddProduct(req,res){
    // Handle form submission and create new product object
  const product = new productModel({
    title: req.body.title,
    price: req.body.price,
    desc: req.body.desc,
    stock: req.body.stock,
    category: req.body.category,
    mainImage:req.files.mainImage[0],
    sideImages:req.files.sideImages
      
  });

  try {
    await product.save();
    res.redirect('/admin/productManage');
  } catch (err) {
    console.error(err);
    res.render({ message: 'Failed to add product' });
  }
}

export async function editProductPage(req,res){
    let id=req.params.id
    let product =await productModel.findById(id).lean()
    res.render('admin/editProduct',{product})
    console.log("edit "+product);
  }
  
export async function editProduct(req,res){
    const _id=req.params.id
    const {title,
      category,
      stock,
      price,
      desc}=req.body
    try {
      let product;
      if (req.files?.mainImage && req.files?.sideImages) {
        product = await productModel.updateOne(
          { _id },
          {
            $set: {
              title,
              category,
              stock,
              price,
              desc,
              mainImage: req.files.mainImage[0],
              sideImages: req.files.sideImages,
            },
          }
        );
        
      } else if (!req.files?.mainImage && req.files?.sideImages) {
        product = await productModel.updateOne(
          { _id },
          {
            $set: {
              title,
              category,
              stock,
              price,
              desc,
              
              sideImages: req.files.sideImages,
            },
          }
        );
      } else if (!req.files?.mainImage && !req.files?.sideImages) {
        product = await productModel.updateOne(
          { _id },
          {
            $set: {
              title,
              category,
              stock,
              price,
              desc,
             
            },
          }
        );
      } else if (req.files?.mainImage && !req.files?.sideImages) {
        product = await productModel.updateOne(
          { _id },
          {
            $set: {
              title,
              category,
              stock,
              price,
              desc,
              mainImage: req.files.mainImage[0],
              
            },
          }
        );
      }
      return res.redirect("/admin/productManage");
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  };
  
    // console.log('iiii'+id);
    // const product =await productModel.findOne({id})
    // console.log('postEditProduct'+product);
    // let editedProduct=await productModel.findByIdAndUpdate(id,req.body,{new:true})
    // console.log('postEdit'+editedProduct);
    // res.redirect('/admin/productManage')
  //}
  
  
export async function deleteProduct(req,res){
    const deletedProduct= await productModel.findOneAndDelete({_id:req.params.id})
    res.json(deletedProduct)
  }
  


  //category
  
export async function postAddCategory(req,res){
    let categoryExist = await categoryModel.findOne({name:req.body.name})
      // Handle form submission and create new product object
    const category = new categoryModel({
      name: req.body.name,
    });
      // Save new category to database using Mongoose
   if(!categoryExist){   
  try {
    await category.save();
    res.redirect('/admin/CategoryManage');
  } catch (err) {
    console.error(err);
  }
}else {
  categoryExistError="Category Exists"
  res.redirect('/admin/CategoryManage');
}
}

export async function getCategoryManage(req,res){
  let categoryData = await categoryModel.find().lean()
  res.render('admin/categoryManage',{categoryData,categoryExistError})
  categoryExistError=null
//    console.log(categoryData);
}
export async function unlistCategory(req,res){
  const {id}=req.params
  await categoryModel.findByIdAndUpdate(id,{$set:{list:false}})
  res.redirect('/admin/categoryManage')
  //  
}
export async function listCategory(req,res){
  const {id}=req.params
  await categoryModel.findByIdAndUpdate(id,{$set:{list:true}})
  res.redirect('/admin/categoryManage')
  //  
}

//ajax  

// export async function unlistCategory(req, res) {
//   const { id } = req.params;
//   const updatedCategory = await categoryModel.findByIdAndUpdate(id, { $set: { list: false } }, { new: true });
//   res.json(updatedCategory);
// }

// export async function listCategory(req, res) {
//   const { id } = req.params;
//   const updatedCategory = await categoryModel.findByIdAndUpdate(id, { $set: { list: true } }, { new: true });
//   res.json(updatedCategory);
// }


//coupon

const formatDate = function(date, format) {
  moment.locale('en');
  return moment(date).tz('Asia/Kolkata').format(format);
};
export async function getCouponManage(req,res){
  let couponData = await couponModel.find().lean()
  res.render('admin/couponManage',{formatDate,couponData,couponExistError})
  couponExistError=null

}

export async function postAddCoupon(req,res){
  
  let couponExist = await couponModel.findOne({name:req.body.name})
    // Handle form submission and create new product object
  const coupon = new couponModel({
    name: req.body.name,
    code: req.body.code,
    discountValue: req.body.discountValue,
    minSaleValue: req.body.minSaleValue,
    expiryDate: req.body.expiryDate,
  });
  console.log("called post coupon "+coupon);
    // Save new category to database using Mongoose
 if(!couponExist){   
try {
  await coupon.save();
  console.log("save coupon "+coupon);
  res.redirect('/admin/CouponManage');
} catch (err) {
  console.error(err);
}
}else {
couponExistError="Coupon Exists"
res.redirect('/admin/CouponManage');
}
}

export async function unlistCoupon(req,res){
  const {id}=req.params
await couponModel.findByIdAndUpdate(id,{$set:{list:false}})
    res.redirect('/admin/couponManage')
 //  
 }
export async function listCoupon(req,res){
  const {id}=req.params
await couponModel.findByIdAndUpdate(id,{$set:{list:true}})
    res.redirect('/admin/couponManage')
 //  
 }
export async function getEditCoupon(req,res){
  let {id}=req.params
  console.log(id);
  let coupon =await couponModel.findById(id).lean()
  console.log(coupon);
  res.render('admin/editCoupon',{formatDate, coupon})
} 
export async function postEditCoupon(req,res){
  const id=req.params.id
  // await offerModel.findByIdAndUpdate(_id, {
  //   $set: { name, url, image: req.file.filename },
  // });
  let editedCoupon=await couponModel.findByIdAndUpdate(id,req.body,{new:true})
  console.log('postEdit'+editedCoupon);
  res.redirect('/admin/couponManage')
}
