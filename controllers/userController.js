import productModel from "../model/productModel.js";
import userModel from "../model/userModel.js";
import sendOTP from "../actions/sendOTP.js";
import bcrypt from "bcryptjs"; 
import couponModel from "../model/couponModel.js";
var salt = bcrypt.genSaltSync(10);

let isLoggedIn;
let users = "";
let signupError;
let loginError;
let otpError;

export async function getUserLoginPage(req, res) {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginError });
    loginError = null;
  }
  console.log(req.session.user,isLoggedIn);
}
export async function getUserSignupPage(req, res) {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/signup", { signupError });
    signupError = null;
  }
}
export async function getSignupOtp(req, res) {
  res.render("user/signupOtp", { otpError });
  otpError = null;
}
export async function getUserHomePage(req, res) {
  try {
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    let productData = await productModel.find({list:true}).lean().limit(9);
    res.render("user/index", { productData, isLoggedIn });
  } catch (error) {
    console.error("Error getting homepage:", error);
    res.status(500).send("Internal server error");
  }
  console.log(req.session.user,isLoggedIn);
}
export async function getUserLogout(req, res) {
  req.session.user = null;
  isLoggedIn = false;
  res.redirect("/");
  console.log(req.session.user,isLoggedIn);
}
export async function getUserForgetPassPage(req, res) {
  res.render("user/forgetPassword");
}
export async function getOtpPage(req, res) {
  res.render("user/otpPage",{otpError});
}
export async function getResetPage(req, res) {
  res.render("user/resetPassword");
}


export async function userLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    // var hashPassword = bcrypt.hashSync(password, salt); 
    const user = await userModel.findOne({ email });
    isLoggedIn = true;
    console.log("user:" + user);
    if (user) {
      if (bcrypt.compareSync(password, user.password)) {
        req.session.user = {
          id: user._id,
        };

        res.redirect("/");
      } else {
        loginError = "Credentials not match";
        console.log("pass error");
        res.redirect("/login");
      }
    } else {
      res.redirect("/login");
      console.log("email error");
      loginError = "Not registered. Create account";
    }
  } catch (error) {
    console.error("Error while submiting Login:", error);
    res.status(500).send("Internal server error");
  }
  console.log(req.session.user,isLoggedIn);
}

export async function signup(req, res) {
  try {
    req.session.tempUser = req.body;
    const exiUser = await userModel.findOne({ email: req.body.email });
    if (!exiUser) {
      //
      const otp = Math.floor(Math.random() * 1000000);
      sendOTP(req.body.email, otp)
        .then(() => {
          req.session.otp = otp;
          console.log(req.session.otp,'oootop');
          return res.render("user/signupOtp");
          otpError = null;
          
        })
        .catch((err) => {
          return res.render("user/signup", {
            // error: true,
            // message: "Email sent Failed",
          });
        });
      
    } else {
      signupError = "Email already exist. Please go to login";
      res.redirect("/signup");
    }
  } catch (error) {
    console.error("Error submitting signup page:", error);
    res.status(500).send("Internal server error");
  }
}

//
export async function resendOTP(req, res) {
  try {
    const otp = Math.floor(Math.random() * 1000000);
    sendOTP(req.body.email, otp)
      .then(() => {
        req.session.otp = otp;
        return res.render("user/signupOtp");
      })
      .catch((err) => {
        return res.render("user/signup", {
          // error: true,
          // message: "Email sent Failed",
        });
      });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).send("Internal server error");
  }
}
//

export async function signupOtp(req, res) {
  try {
    let OTP = req.body.OTP;
    const {name,email,password} = req.session.tempUser;

    if (OTP == req.session.otp) {
      console.log("otp:" + OTP);
      var hashPassword = bcrypt.hashSync(password, salt);
      const user = new userModel({ name, email, password: hashPassword});
      user.save()


      // let newUser = await userModel.create(user);
      console.log("signup:" + user);
      res.redirect("/login");
    } else {
      otpError = "OTP not valid";
      res.redirect("/signupOtp");
    }
  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).send("Internal server error");
  }
}

export async function emailCheckResetPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    console.log(user);
    if (!user) {
      res.redirect("/forgetPassword");
    } else {
      const otp = Math.floor(Math.random() * 1000000);
      sendOTP(req.body.email, otp)
        .then(() => {
          req.session.otp = otp;
          console.log("otp",otp);
          req.session.userId = user.id;
          console.log('userid',req.session.userId,'session otp',req.session.otp);
          res.render("user/otpPage",{ otpError });
          otpError = null;
        })
    
    }
  } catch (error) {
    console.error("Error getting reset page", error);
    res.status(500).send("Internal server error");
  }
}

export async function verifyOTP(req, res) {
  let OTP = req.body.OTP;
  try {
    if (req.body.OTP == req.session.otp) {
      console.log(req.body);
      res.render("user/resetPassword");
      otpError = null;
    } else {
      console.log("no OTP");
      otpError = "Enter valid OTP"
      res.redirect("/getOtpPage");
    }
  } catch (error) {
    // Log the error and send a 500 status code with an error message to the client
    console.error("Error entering otp:", error);
    res.status(500).send("Internal server error");
  }
}

export async function resetPassword(req, res) {
  try {
    let userId = req.session.userId;
    console.log("reset pass userId",userId);
    const { password, confirmPassword } = req.body;
    // const user = await userModel.findOne({userId });
    if (password == confirmPassword) {
      console.log("Password Match");
      var hashPassword = bcrypt.hashSync(password, salt);
      let editedPassword = await userModel.findByIdAndUpdate(userId, {password:hashPassword}, {
        new: true,
      });
      console.log(editedPassword,'ep');
      res.redirect("/login");
    } else {
      console.log("Password not match");
      res.redirect("/getResetPage");
    }
  } catch (error) {
    // Log the error and send a 500 status code with an error message to the client
    console.error("Error resetting password:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getProductPage(req, res) {
  try {
    let id = req.params.id;
    let singleProduct = await productModel.findById(req.params.id).lean();
    console.log(singleProduct + "SP");
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    res.render("user/productPage", { isLoggedIn, singleProduct });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getProductByCategory(req,res){
  const id=req.params.id
  try {
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    let productData = await productModel.find({category:id,list:true}).lean().limit(12);
    res.render("user/productsBycategory", { productData, isLoggedIn });
  } catch (error) {
    console.error("Error getting Category wise products page:", error);
    res.status(500).send("Internal server error");
  }
}


export async function getCartPage(req, res) {
  if (!req.session.user) {
    return res.redirect("/login");
  }else{

  // Get user and cart details
  const user = req.session.user;
  console.log(user);
  const cartQuantity = {};
  const userId = user.id;
  console.log(userId);
  const cartDetails = await userModel.findOne({ _id: userId }, { cart: 1 });
  console.log(cartDetails);

  //Get cart items and quantity
  const cartItems = cartDetails.cart.map((item) => {
    cartQuantity[item.id] = item.quantity;
    return item.id;
  });
console.log('cartQuantity', cartQuantity);
console.log('cartItems', cartItems);
  // Get product details for cart items
  const products = await productModel.find({ _id: { $in: cartItems } }).lean();
 

console.log('ppppp',products);
//Calculate total amount and discount
let totalAmount = 0;
let itemprize;
let quantity
let productsTotal
products.forEach((item, index) => {
  quantity = cartQuantity[item._id];
  console.log('qqqq',quantity);
  products[index].quantity = quantity;
  totalAmount = totalAmount + item.price * cartQuantity[item._id];
  console.log('totAMou',totalAmount);
  item.itemprize = item.price * item.quantity
});

console.log(quantity,"all qua");
  console.log('ttttttt',totalAmount);
  res.render('user/cart',{products,totalAmount,isLoggedIn})
 }
}


export async function addToCart(req, res) {
  const id = req.session.user.id;

  const proId = req.params.id;
  
  await userModel.updateOne(
    { _id: id },
    {
      $addToSet: {
        cart: {
          id: proId,
          quantity: 1,
        },
      },
    }
  );
  res.json({addedToCart:true});
  // console.log({ message: "added " + proId + " to " + id });
  // res.redirect('/')
}

export async function deleteFromCart(req, res) {
  const id = req.session.user.id;
  const proId = req.params.id;
  await userModel.updateOne(
    { _id:id },
    {
      $pull: {
        cart: { id: proId },
      },
    }
  );
  // res.json({ message: "deleted " + proId + " from " + id });
  res.redirect('/cart')
}
export async function addQuantity(req, res) {
  const user = await userModel.updateOne(
    { _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } },
    {
      $inc: {
        "cart.$.quantity": 1,
      },
    }
  );
  // res.json({ user });
  res.redirect('/cart')
}

export async function minusQuantity(req, res) {
  let { cart } = await userModel.findOne(
    { "cart.id": req.params.id },
    { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
  );
  if (cart[0].quantity <= 1) {
    let user = await userModel.updateOne(
      { _id: req.session.user.id },
      {
        $pull: {
          cart: { id: req.params.id },
        },
      }
    );
    res.redirect('/cart')
    // return res.json({ user: { acknowledged: false } });

  }else{
  let user = await userModel.updateOne(
    { _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } },
    {
      $inc: {
        "cart.$.quantity": -1,
      },
    }
  );
  // return res.json({ user });
  res.redirect('/cart')
  }
}