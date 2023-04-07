import productModel from "../model/productModel.js";
import userModel from "../model/userModel.js";
import sendOTP from "../actions/sendOTP.js";
import bcrypt from "bcryptjs";
import couponModel from "../model/couponModel.js";
import orderModel from "../model/orderModel.js";
import handlebars from "handlebars";
import handlebarsHelpers from "handlebars-helpers";
import moment from "moment-timezone";

handlebarsHelpers({ handlebars });

import categoryModel from "../model/categoryModel.js";
import createId from "../actions/createId.js";
import axios from "axios";
var salt = bcrypt.genSaltSync(10);

let isLoggedIn;
let users = "";
let signupError;
let loginError;
let otpError;
let userName;
let cartTotal;
const formatDate = function (date, format) {
  moment.locale("en");
  return moment(date).tz("Asia/Kolkata").format(format);
};

export async function getUserLoginPage(req, res) {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/login", { loginError });
      loginError = null;
    }
    console.log(req.session.user, isLoggedIn);
  } catch (error) {
    console.error("Error getting login page:", error);
    res.redirect("/");
  }
}
export async function getUserSignupPage(req, res) {
  try {
    if (req.session.user) {
      res.redirect("/");
    } else {
      res.render("user/signup", { signupError });
      signupError = null;
    }
  } catch (error) {
    console.error("Error getting signup page:", error);
    res.redirect("/");
  }
}
export async function getSignupOtp(req, res) {
  try {
    res.render("user/signupOtp", { otpError });
    otpError = null;
  } catch (error) {
    console.error("Error getting signup otp:", error);
    res.redirect("/");
  }
}
export async function getUserHomePage(req, res) {
  let totalQty = 0;
  try {
    if (req.session.user) {
      isLoggedIn = true;
      userName = req.session.user.name;
      cartTotal=req.session.user.cartTotal
      console.log('cRT',cartTotal);
    } else {
      isLoggedIn = false;
      userName = null;
    }

    let productData = await productModel.find({ list: true }).lean().limit(8);
    res.render("user/index", { productData, userName, isLoggedIn,cartTotal });
  } catch (error) {
    console.error("Error getting homepage:", error);
    res.redirect("/");
  }
}

export async function getUserLogout(req, res) {
  try {
    req.session.user = null;
    req.session.cartProducts = null;
    req.session.coupon = null;
    req.session.order = null;
    isLoggedIn = false;
  
    res.redirect("/");
  } catch (error) {
    console.error("Error logging out user:", error);
    res.redirect("/");
  }
}
export async function getUserForgetPassPage(req, res) {
  try {
    res.render("user/forgetPassword");
  } catch (error) {
    console.error("Error forget password page:", error);
    res.redirect("/");
  }
}
export async function getOtpPage(req, res) {
  try {
    res.render("user/otpPage", { otpError });
  } catch (error) {
    console.error("Error getting otp page:", error);
    res.redirect("/");
  }
}
export async function getResetPage(req, res) {
  try {
    res.render("user/resetPassword");
  } catch (error) {
    console.error("Error getting password reset page:", error);
    res.redirect("/");
  }
}

export async function userLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const cartQuantity = {};
    const user = await userModel.findOne({ email });
    const cartDetails = await userModel.findOne({ email: email }, { cart: 1 });
    let totalQty = 0;
    

    //Get cart items and quantity
    const cartItems = cartDetails.cart.map((item) => {
      cartQuantity[item.id] = item.quantity;
      totalQty = totalQty + item.quantity;
      return item.id;
    });
    
    console.log("userCartTotal",totalQty);
    isLoggedIn = true;
    console.log("user:" + user);
    if (user) {
      if (user?.block) {
        loginError = "This Email is Blocked for suspicious activity";
        res.redirect("/login");
      } else {
        if (bcrypt.compareSync(password, user.password)) {
          req.session.user = {
            id: user._id,
            name: user.name,
            block: user.block,
cartTotal:totalQty,
          };

          res.redirect("/");
        } else {
          loginError = "Credentials not match";
          console.log("pass error");
          res.redirect("/login");
        }
      }
    } else {
      res.redirect("/login");
      console.log("email error");
      loginError = "Not registered. Create account";
    }
  } catch (error) {
    console.error("Error while submiting Login:", error);
    res.redirect("/");
  }
  console.log(req.session.user, isLoggedIn);
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
          console.log(req.session.otp, "oootop");
          return res.render("user/signupOtp");
          otpError = null;
        })
        .catch((err) => {
          return res.render("user/signup", {});
        });
    } else {
      signupError = "Email already exist. Please go to login";
      res.redirect("/signup");
    }
  } catch (error) {
    console.error("Error submitting signup page:", error);
    res.redirect("/");
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
        return res.render("user/signup", {});
      });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.redirect("/");
  }
}
//

export async function signupOtp(req, res) {
  try {
    let OTP = req.body.OTP;
    const { name, email, password } = req.session.tempUser;

    if (OTP == req.session.otp) {
      console.log("otp:" + OTP);
      var hashPassword = bcrypt.hashSync(password, salt);
      const user = new userModel({ name, email, password: hashPassword });
      user.save();

      // let newUser = await userModel.create(user);
      console.log("signup:" + user);
      res.redirect("/login");
    } else {
      otpError = "OTP not valid";
      res.redirect("/signupOtp");
    }
  } catch (error) {
    console.error("OTP Error:", error);
    res.redirect("/");
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
      sendOTP(req.body.email, otp).then(() => {
        req.session.otp = otp;
        console.log("otp", otp);
        req.session.userId = user.id;
        console.log(
          "userid",
          req.session.userId,
          "session otp",
          req.session.otp
        );
        res.render("user/otpPage", { otpError });
        otpError = null;
      });
    }
  } catch (error) {
    console.error("Error getting reset page", error);
    res.redirect("/");
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
      otpError = "Enter valid OTP";
      res.redirect("/getOtpPage");
    }
  } catch (error) {
    // Log the error and send a 500 status code with an error message to the client
    console.error("Error entering otp:", error);
    res.redirect("/");
  }
}

export async function resetPassword(req, res) {
  try {
    let userId = req.session.userId;
    console.log("reset pass userId", userId);
    const { password, confirmPassword } = req.body;
    // const user = await userModel.findOne({userId });
    if (password == confirmPassword) {
      console.log("Password Match");
      var hashPassword = bcrypt.hashSync(password, salt);
      let editedPassword = await userModel.findByIdAndUpdate(
        userId,
        { password: hashPassword },
        {
          new: true,
        }
      );
      console.log(editedPassword, "ep");
      res.redirect("/login");
    } else {
      console.log("Password not match");
      res.redirect("/getResetPage");
    }
  } catch (error) {
    // Log the error and send a 500 status code with an error message to the client
    console.error("Error resetting password:", error);
    res.redirect("/");
  }
}

export async function getProductPage(req, res) {
  try {
    let id = req.params.id;
    let singleProduct = await productModel.findById(req.params.id).lean();
    let cart = await userModel.findOne(
      { "cart.id": req.params.id },
      { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
    );
    console.log(cart + "SP");
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    res.render("user/productPage", { isLoggedIn, singleProduct, cart });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.redirect("/");
  }
}

export async function getProductByCategory(req, res) {
  const id = req.params.id;
  try {
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    let productData = await productModel
      .find({ category: id, list: true })
      .lean()
      .limit(12);
    res.render("user/productsBycategory", { productData, isLoggedIn });
  } catch (error) {
    console.error("Error getting Category wise products page:", error);
    res.redirect("/");
  }
}

export async function getCartPage(req, res) {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    } else {
      // Get user and cart details
      const user = req.session.user;
      const cartQuantity = {};
      const userId = user.id;
      const cartDetails = await userModel.findOne({ _id: userId }, { cart: 1 });
      let totalQty = 0;

      //Get cart items and quantity
      const cartItems = cartDetails.cart.map((item) => {
        cartQuantity[item.id] = item.quantity;
        totalQty = totalQty + item.quantity;
        return item.id;
      });
      console.log("tqt", totalQty);
      // Get product details for cart items
      const products = await productModel
        .find({ _id: { $in: cartItems } })
        .lean();

      //Calculate total amount and discount
      let totalAmount = 0;
      let quantity;
      let totalMRP = 0;
      products.forEach((item, index) => {
        quantity = cartQuantity[item._id];
        products[index].quantity = quantity;
        totalAmount = totalAmount + item.price * cartQuantity[item._id];
        item.itemprice = item.price * item.quantity;
        item.itemMRP = item.MRP * item.quantity;
        totalMRP = totalMRP + item.MRP * cartQuantity[item._id];
      });
      let discount = totalMRP - totalAmount;
      req.session.cartProducts = {
        products,
        totalAmount,
        totalMRP,
        discount,
        totalQty,
      };
      res.render("user/cart", {
        products,
        totalAmount,
        totalMRP,
        discount,
        isLoggedIn,
      });
    }
  } catch (error) {
    console.error("Error getting cart page:", error);
    res.redirect("/");
  }
}

export async function addToCart(req, res) {
  try {
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
    res.json({ addedToCart: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.redirect("/cart");
  }
}

export async function deleteFromCart(req, res) {
  try {
    const id = req.session.user.id;
    const proId = req.params.id;

    await userModel.updateOne(
      { _id: id },
      {
        $pull: {
          cart: { id: proId },
        },
      }
    );
    res.redirect("/cart");
  } catch (error) {
    console.error("Error deleting item from cart:", error);
    res.redirect("/cart");
  }
}
export async function addQuantity(req, res) {
  try {
    let { cart } = await userModel.findOne(
      { "cart.id": req.params.id },
      { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
    );
    let Qty = cart[0].quantity;
    let productStock = await productModel.findOne(
      { _id: req.params.id },
      { stock: 1, _id: 0 }
    );
    let stock = productStock.stock;
    console.log(stock, "se");
    if (stock <= Qty) {
      res.json({ stockEmpty: true });
    } else {
      const userCart = await userModel.updateOne(
        {
          _id: req.session.user.id,
          cart: { $elemMatch: { id: req.params.id } },
        },
        {
          $inc: {
            "cart.$.quantity": 1,
          },
        }
      );
      Qty = Qty + 1;

      const user = req.session.user;
      const cartQuantity = {};
      const userId = user.id;
      const cartDetails = await userModel.findOne({ _id: userId }, { cart: 1 });
      let totalQty = 0;

      //Get cart items and quantity
      const cartItems = cartDetails.cart.map((item) => {
        cartQuantity[item.id] = item.quantity;
        totalQty = totalQty + item.quantity;
        return item.id;
      });
      // Get product details for cart items
      const products = await productModel
        .find({ _id: { $in: cartItems } })
        .lean();

      //Calculate total amount and discount
      let totalAmount = 0;
      let quantity;
      let totalMRP = 0;
      products.forEach((item, index) => {
        quantity = cartQuantity[item._id];
        products[index].quantity = quantity;
        totalAmount = totalAmount + item.price * cartQuantity[item._id];
        item.itemprice = item.price * item.quantity;
        item.itemMRP = item.MRP * item.quantity;
        totalMRP = totalMRP + item.MRP * cartQuantity[item._id];
      });

      let discount = totalMRP - totalAmount;
      req.session.cartProducts = {
        products,
        totalAmount,
        totalMRP,
        discount,
        totalQty,
      };
      res.json({ totalAmount, totalMRP, discount, products, Qty });
    }
  } catch (error) {
    console.error("Error adding cart quantity:", error);
    res.redirect("/cart");
  }
}

export async function minusQuantity(req, res) {
  try {
    let { cart } = await userModel.findOne(
      { "cart.id": req.params.id },
      { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
    );

    let Qty = cart[0].quantity;
    if (cart[0].quantity <= 1) {
      let user = await userModel.updateOne(
        { _id: req.session.user.id },
        {
          $pull: {
            cart: { id: req.params.id },
          },
        }
      );
      res.redirect("/cart");
    } else {
      let userCart = await userModel.updateOne(
        {
          _id: req.session.user.id,
          cart: { $elemMatch: { id: req.params.id } },
        },
        {
          $inc: {
            "cart.$.quantity": -1,
          },
        }
      );
      const user = req.session.user;
      const cartQuantity = {};
      const userId = user.id;
      const cartDetails = await userModel.findOne({ _id: userId }, { cart: 1 });
      let totalQty = 0;

      //Get cart items and quantity
      const cartItems = cartDetails.cart.map((item) => {
        cartQuantity[item.id] = item.quantity;
        totalQty = totalQty + item.quantity;
        return item.id;
      });
      console.log("totalQty", totalQty);
      // Get product details for cart items
      const products = await productModel
        .find({ _id: { $in: cartItems } })
        .lean();

      //Calculate total amount and discount
      let totalAmount = 0;
      let quantity;
      let totalMRP = 0;
      products.forEach((item, index) => {
        quantity = cartQuantity[item._id];
        products[index].quantity = quantity;
        totalAmount = totalAmount + item.price * cartQuantity[item._id];
        item.itemprice = item.price * item.quantity;
        item.itemMRP = item.MRP * item.quantity;
        totalMRP = totalMRP + item.MRP * cartQuantity[item._id];
      });
      let { cart } = await userModel.findOne(
        { "cart.id": req.params.id },
        { _id: 0, cart: { $elemMatch: { id: req.params.id } } }
      );
      let Qty = cart[0].quantity;
      let discount = totalMRP - totalAmount;
      req.session.cartProducts = {
        products,
        totalAmount,
        totalMRP,
        discount,
        totalQty,
      };
      console.log(totalQty, "TQ");
      res.json({ totalAmount, totalMRP, discount, products, Qty });
    }
  } catch (error) {
    console.error("Error decrease quantity:", error);
    return res.redirect("/cart");
  }
}
let couponError;
export async function couponValidation(req, res) {
  let coupon = await couponModel.findOne({ code: req.body.code, list: true });
  const { totalAmount } = req.session.cartProducts;
  if (totalAmount < coupon?.minSaleValue) {
    couponError = `Min Purchase should be equal or above ${coupon.minSaleValue} to apply this coupon`;
  } else {
    couponError = coupon ? "Coupon Applied" : "Invalid Coupon";
    req.session.coupon = coupon;
  }
  res.redirect("/checkout");
}
// export async function getCheckout(req,res){
//   try{
//   checkout()
//   }catch(error){
// console.error("error getting checkout",error);
//     return res.redirect('/cart')
//   }
// }
export async function checkout(req, res) {
  let id = req.session.user.id;
  let couponValue = req.session.coupon ? req.session.coupon.discountValue : 0;
  const addDetails = await userModel.findOne({ _id: id }).select("address");
  let totalQty = 0;

  let addresses;
  if (!req.session.cartProducts) {
    res.redirect("/cart");
  } else {
    let { totalMRP, discount, totalAmount } = req.session.cartProducts;
    try {
      if (req.session.user) {
        isLoggedIn = true;
      } else {
        isLoggedIn = false;
      }
      totalAmount = totalAmount - couponValue;
      res.render("user/checkout", {
        isLoggedIn,
        userName,
        totalMRP,
        discount,
        totalAmount,
        couponValue,
        couponError,
        addressess: addDetails.address,
      });
      couponError = null;
    } catch (error) {
      console.error("Error checkout:", error);
      res.redirect("/cart");
    }
  }
}

export async function addToAddress(req, res) {
  try {
    const id = req.session.user.id;
    const { name, state, pincode, district, place, street, house } = req.body;

    await userModel.updateOne(
      { _id: id },
      {
        $push: {
          address: {
            name,
            house,
            street,
            place,
            district,
            state,
            pincode,
            id: createId(),
          },
        },
      }
    );
    let addresses = await userModel.findOne({ _id: id }, { address: 1 }).lean();
    const { products, totalAmount, totalMRP, discount, totalQty } =
      req.session.cartProducts;

    res.redirect("/checkout");
  } catch (error) {
    console.error("Error while submiting address:", error);
    res.redirect("/cart");
  }
}

export async function proceedToPayment(req, res) {
  try {
    let userId = req.session.user.id;
    let userName = req.session.user.name;
    let products = req.session.cartProducts.products;
    let totalMRP = req.session.cartProducts.totalMRP;
    let discount = req.session.cartProducts.discount;
    let totalQty = req.session.cartProducts.totalQty;
    let orderCount = await orderModel.find().count();
    let orderId = orderCount + 1001;
    let orderDetails;
    console.log("proceedToPayment", totalMRP);
    const { address, totalAmount, paymentType, couponValue } = req.body;
    const order = await orderModel({
      userId,
      address,
      paymentType,
      amountPayable: totalAmount,
      total: totalAmount,
      product: products,
      discount,
      orderId,
      totalQuantity: totalQty,
      MRP: totalMRP,
      paid:true,
    });
    req.session.order = order;
    if (paymentType != "cod") {
      let orderId = "order_" + createId();
      const options = {
        method: "POST",
        url: "https://sandbox.cashfree.com/pg/orders",
        headers: {
          accept: "application/json",
          "x-api-version": "2022-09-01",
          "x-client-id": "TEST345428d48bc6c70de376570427824543",
          "x-client-secret": "TESTd0dc46b65581a42b3adb8750070e064b1d020f25",
          "content-type": "application/json",
        },
        data: {
          order_id: orderId,
          order_amount: req.body.totalAmount,
          order_currency: "INR",
          customer_details: {
            customer_id: userId,
            customer_email: "mohsinub123@gmail.com",
            customer_phone: "9633975885",
          },
          order_meta: {
            return_url:
              "https://adanperfumes.mohsinub.online/verifyPayment?order_id={order_id}",
          },
        },
      };

      await axios
        .request(options)
        .then(function (response) {
          return res.render("user/paymentTemp", {
            orderId,
            sessionId: response.data.payment_session_id,
          });
        })
        .catch(function (error) {
          console.error(error);
        });
    } else {
      const order = await orderModel({
        userId,
        address,
        paymentType,
        amountPayable: totalAmount,
        total: totalAmount,
        product: products,
        discount,
        orderId,
        totalQuantity: totalQty,
        MRP: totalMRP,
        paid:false,
      });
      order.save();
      // let { _id, createdAt } = order;
      console.log(order);
      // console.log("cartPrSession", order.id);
      await userModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
      for (let i = 0; i < products.length; i++) {
        await productModel.updateOne(
          { _id: products[i]._id },
          { $inc: { stock: -req.session.order.product[i].quantity } }
        );
      }
      console.log(isLoggedIn, userName, order, "gghs");
      res.render("user/orderPlaced", { isLoggedIn, userName, order });

      req.session.order = null;
      req.session.coupon = null;
      req.session.cartProducts = null;
    }
  } catch (error) {
    console.error("Error while getting payment page:", error);
    res.redirect("/cart");
  }
}

//
export async function getUserPayment(req, res) {
  const userId = req.session.user.id;
  const user = await userModel.findById(userId).lean();

  const cart = user.cart;
  const cartList = cart.map((item) => {
    return item.id;
  });
  const products = await productModel.find({ _id: { $in: cartList } }).lean();

  const order_id = req.query.order_id;

  const options = {
    method: "GET",
    url: "https://sandbox.cashfree.com/pg/orders/" + order_id,
    headers: {
      accept: "application/json",
      "x-api-version": "2022-09-01",
      "x-client-id": "TEST345428d48bc6c70de376570427824543",
      "x-client-secret": "TESTd0dc46b65581a42b3adb8750070e064b1d020f25",
      "content-type": "application/json",
    },
  };

  try {
    const response = await axios.request(options);
    if (response.data.order_status === "PAID") {
      console.log("paid");
      await orderModel.create(req.session.order);
      for (let i = 0; i < products.length; i++) {
        await productModel.updateOne(
          { _id: products[i]._id },
          { $inc: { stock: -req.session.order.product[i].quantity } }
        );
      }
      const order = req.session.order;
      await userModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
      res.render("user/orderPlaced", { isLoggedIn, userName, order });
      req.session.order = null;
      req.session.coupon = null;
      req.session.cartProducts = null;
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/cart");
  }
}

export async function getOrderHistory(req, res) {
  try {
    let userId = req.session.user.id;
    let productQty = 0;
    let orders = await orderModel
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .lean();
    let qqq = await orderModel
      .findOne({ userId: userId }, { product: 1 })
      .sort({ createdAt: -1 })
      .lean();

    for (let order of orders) {
      for (let product of order.product) {
        productQty += product.quantity;
      }
    }

    res.render("user/orderHistory", { isLoggedIn, orders, formatDate });
  } catch (error) {
    console.error("Error getting order list page:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getProfile(req, res) {
  try {
    const id = req.session.user.id;
    const user = await userModel.findOne({ _id: id });
    let name = user.name.toUpperCase();
    let email = user.email;
    const addDetails = await userModel.findOne({ _id: id }).select("address");
    let addressess = addDetails.address;
    console.log(user);
    let addresses = await userModel.findOne({ _id: id }, { address: 1 }).lean();

    res.render("user/profile", { isLoggedIn, name, email, addressess });
  } catch (error) {
    console.error("Error while getting profile:", error);
    res.status(500).send("Internal server error");
  }
}
export async function getEditAddress(req, res) {
  try {
    let { address } = await userModel.findOne(
      { "address.id": req.params.id },
      { _id: 0, address: { $elemMatch: { id: req.params.id } } }
    );

    console.log(address, "addagagh");
    res.render("user/editProfile", { address, isLoggedIn });
  } catch (error) {
    console.log(error);
  }
}

export async function editAddress(req, res) {
  console.log("gfhdgdggdn");
  try {
    await userModel.updateOne(
      {
        _id: req.session.user.id,
        address: { $elemMatch: { id: req.body.id } },
      },
      {
        $set: {
          "address.$": req.body,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error while submiting address:", error);
    res.redirect("/profile");
  }
}

export async function deleteAddress(req, res) {
  try {
    await userModel.updateOne(
      {
        _id: req.session.user.id,
        address: { $elemMatch: { id: req.params.id } },
      },
      {
        $pull: {
          address: {
            id: req.params.id,
          },
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error while getting deleting address:", error);
    res.status(500).send("Internal server error");
  }
}

export async function getOrderDetails(req, res) {
  try {
    const userId = req.session.user.id;
    const orderId = req.params.orderId;
    let userName = req.session.user.name;

    let order = await orderModel
      .find({ userId: userId, orderId: orderId })
      .lean();
    console.log("order d", order);
    res.render("user/orderDetails", { userName, order, isLoggedIn });
  } catch (error) {
    console.error("Error while getting product details:", error);
    res.status(500).send("Internal server error");
  }
}
export async function shop(req, res) {
  try {
    let count;
    let search = req.query.search ?? "";
    let category = req.query.category ?? "";
    let sort = req.query.filter ?? "";
    let page = Number(req.query.page ?? 0);
    page = Math.max(page, 0);
    let categoryFilter;
    // try {
    let categoryName = "all";
    if (category) {
      let [{ name }] = await categoryModel.find(
        { _id: category, list: true },
        { name: 1, _id: 0 }
      );
      categoryName = name;
    }
    if (category) {
      categoryFilter = await categoryModel
        .find({
          list: true,
          _id: category,
        })
        .lean();
    } else {
      categoryFilter = await categoryModel
        .find({
          list: true,
        })
        .lean();
    }
    console.log(categoryFilter, "category");
    let categoryArray = categoryFilter.map((category) => category._id);

    const findConditions = {
      list: true,
      category: { $in: categoryArray },
      title: new RegExp(search, "i"),
    };
    const productData = await productModel
      .find(findConditions)
      .sort(sort == "0" ? { uploadedAt: 1 } : { price: sort })
      .skip(page * 9)
      .limit(9)
      .lean();
    const productCount = await productModel.find(findConditions).lean().count();
    console.log(sort, "sort");
    let categoryData = await categoryModel.find({ list: true }).lean();
    let pageCount = Math.ceil(productCount / 9);
    let pagesCount = [];
    for (let i = 0; i < pageCount; i++) {
      pagesCount.push(i);
    }
    res.render("user/shop", {
      // user,
      productData,
      categoryData,
      categoryName,
      category,
      search,
      sort,
      page,
      pagesCount,
      isLoggedIn,
      userName,
    });
  } catch (error) {
    console.error("Error while getting shop page:", error);
    res.status(500).send("Internal server error");
  }
}
