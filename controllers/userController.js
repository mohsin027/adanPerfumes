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
const formatDate = function (date, format) {
  moment.locale("en");
  return moment(date).tz("Asia/Kolkata").format(format);
};

export async function getUserLoginPage(req, res) {
  if (req.session.user) {
    res.redirect("/");
  } else {
    res.render("user/login", { loginError });
    loginError = null;
  }
  console.log(req.session.user, isLoggedIn);
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
  let totalQty = 0;
  try {
    if (req.session.user) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }

    let productData = await productModel.find({ list: true }).lean().limit(9);
    res.render("user/index", { productData, isLoggedIn });
  } catch (error) {
    console.error("Error getting homepage:", error);
    res.status(500).send("Internal server error");
  }
  console.log(req.session.user, isLoggedIn);
}
export async function getUserLogout(req, res) {
  req.session.user = null;
  // req.session.cartProducts=null;
  // req.session.coupon=null;
  // req.session.order=null;
  isLoggedIn = false;
  res.redirect("/");
  console.log(req.session.user, isLoggedIn);
}
export async function getUserForgetPassPage(req, res) {
  res.render("user/forgetPassword");
}
export async function getOtpPage(req, res) {
  res.render("user/otpPage", { otpError });
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
      if (user?.block) {
        loginError = "This Email is Blocked for suspicious activity";
        res.redirect("/login");
      } else {
        if (bcrypt.compareSync(password, user.password)) {
          req.session.user = {
            id: user._id,
            name: user.name,
            block: user.block,
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
    res.status(500).send("Internal server error");
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
      otpError = "Enter valid OTP";
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
    res.status(500).send("Internal server error");
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
      req.session.cartProducts = { products, totalAmount, totalMRP, discount };
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
    res.status(500).send("Internal server error");
    res.redirect("/");
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
  res.json({ addedToCart: true });
  // console.log({ message: "added " + proId + " to " + id });
  // res.redirect('/')
}

export async function deleteFromCart(req, res) {
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
  // res.json({ message: "deleted " + proId + " from " + id });
  res.redirect("/cart");
}
export async function addQuantity(req, res) {
  const userCart = await userModel.updateOne(
    { _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } },
    {
      $inc: {
        "cart.$.quantity": 1,
      },
    }
  );
  // res.json({ user });
  // res.redirect("/cart");
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
  const products = await productModel.find({ _id: { $in: cartItems } }).lean();

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
  res.json({ totalAmount, totalMRP, discount, products, Qty });
}

export async function minusQuantity(req, res) {
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
    // return res.json({ user: { acknowledged: false } });
  } else {
    let userCart = await userModel.updateOne(
      { _id: req.session.user.id, cart: { $elemMatch: { id: req.params.id } } },
      {
        $inc: {
          "cart.$.quantity": -1,
        },
      }
    );
    // return res.json({ user });
    // res.redirect("/cart");
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
    console.log(totalQty,"TQ");
    res.json({ totalAmount, totalMRP, discount, products, Qty });
  }
}

export async function couponValidation(req, res) {
  let coupon = await couponModel.findOne({ code: req.body.code });
  req.session.coupon = coupon;
  checkout(req, res);
}
export async function checkout(req, res) {
  //
  // console.log(req.session.coupon);
  let id = req.session.user.id;
  let couponValue;
  const addDetails = await userModel.findOne({ _id: id }).select("address");
  let totalQty = 0;
  if (req.session.coupon) {
  }
  //PENDING : edit here
  let coupon = req.session.coupon;
  console.log("cccc", coupon);
  if (coupon) {
    couponValue = coupon.discountValue;
  } else {
    couponValue = 0;
  }
  console.log(couponValue, "ccc");
  let addresses;

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
      totalMRP,
      discount,
      totalAmount,
      couponValue,
      addressess: addDetails.address,
    });

    req.session.coupon = 0;
  } catch (error) {
    console.error("Error checkout:", error);
    res.status(500).send("Internal server error");
    res.redirect("/cart");
  }
}

export async function addToAddress(req, res) {
  try {
    const id = req.session.user.id;
    const {name, state, pincode, district, place, street, house } = req.body;

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
    const { products, totalAmount, totalMRP, discount } =
      req.session.cartProducts;
    // res.render("user/checkout", {
    //   isLoggedIn,
    //   totalMRP,
    //   discount,
    //   totalAmount,
    //   addressess: addresses.address,
    //   products,
    // });
    // console.log({ message: "added " + proId + " to " + id });
    res.redirect("/checkout");
  } catch (error) {
    console.error("Error while submiting address:", error);
    res.status(500).send("Internal server error");
    res.redirect("/cart");
  }
}

// export async function proceedToPayment(req, res) {
//   let userId = req.session.user.id;
//   let userName = req.session.user.name;
//   let products = req.session.cartProducts.products;
//   let totalMRP = req.session.cartProducts.totalMRP;
//   let discount = req.session.cartProducts.discount;
//   // let totalAmount=req.session.cartProducts.totalAmount
//   let orderCount = await orderModel.find().count();
//   let orderId = orderCount + 1000;
//   let orderDetails;
//   console.log("proceedToPayment", req.body);
//   const { address, totalAmount, payment } = req.body;
//   if (payment == "cod") {
//     const order = await orderModel({
//       userId,
//       address,
//       paymentType: payment,
//       amountPayable: totalAmount,
//       total: totalAmount,
//       product: products,
//       orderId,
//     });
//     order.save();
//     let { _id, createdAt } = order;

//     console.log("cartPrSession", order.id);
//     res.render("user/orderPlaced", {
//       isLoggedIn,
//       products,
//       totalAmount,
//       discount,
//       totalMRP,
//       payment,
//       orderId,
//       createdAt,
//       address,
//       userName,
//     });
//   } else {
//     res.send(address);
//   }
// }

export async function proceedToPayment(req, res) {
  try {
    let userId = req.session.user.id;
    let userName = req.session.user.name;
    let products = req.session.cartProducts.products;
    let totalMRP = req.session.cartProducts.totalMRP;
    let discount = req.session.cartProducts.discount;
    let totalQty = req.session.cartProducts.totalQty;
    // let totalAmount=req.session.cartProducts.totalAmount
    let orderCount = await orderModel.find().count();
    let orderId = orderCount + 1000;
    let orderDetails;
    console.log("proceedToPayment", totalQty);
    const { address, totalAmount, payment } = req.body;
    const order = await orderModel({
      userId,
      address,
      paymentType: payment,
      amountPayable: totalAmount,
      total: totalAmount,
      product: products,
      orderId,
      totalQuantity:totalQty
    });
    req.session.order = order;
    if (payment != "cod") {
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
              "http://localhost:5000/verifyPayment?order_id={order_id}",
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
      order.save();
      // let { _id, createdAt } = order;
      console.log("hi");
      // console.log("cartPrSession", order.id);
      await userModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
      for (let i = 0; i < products.length; i++) {
        await productModel.updateOne(
          { _id: products[i]._id },
          { $inc: { stock: -req.session.order.product[i].quantity } }
        );
      }
      res.render("user/orderPlaced", {
        isLoggedIn,
        userName,
        payment,
        address,
        products,
        totalMRP,
        totalAmount,
        discount,
      });

      req.session.order = null;
      req.session.coupon = null;
      req.session.cartProducts = null;
    }
  } catch (error) {
    console.error("Error while getting payment page:", error);
    res.status(500).send("Internal server error");
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
      await orderModel.create(req.session.order);
      console.log("hhhhhh", req.session.order);
      for (let i = 0; i < products.length; i++) {
        await productModel.updateOne(
          { _id: products[i]._id },
          { $inc: { stock: -req.session.order.product[i].quantity } }
        );
      }
      await userModel.findByIdAndUpdate(userId, { $set: { cart: [] } });
      res.render("user/orderPlaced");
    } else {
      res.redirect("/cart");
    }
  } catch (error) {
    console.error(error);
    res.redirect("/cart");
  }
}
//

// export async function shop(req, res) {
//   // let category={}
//   const categoryData = await categoryModel.find().lean();
//   const category = req.query.category ?? "";
//   const search = req.query.search ?? "";
//   const filter = req.query.filter ?? "";
//   const page = req.query.page ?? 0;
//   console.log(category, search);
//   let count = 0;
//   let productData = [];

//   if (filter == 0) {
//     if (category.length != 24) {
//       productData = await productModel
//         .find({
//           title: new RegExp(search, "i"),
//         })
//         .sort({ uploadedAt: -1 })
//         .skip(page * 9)
//         .limit(9)
//         .lean();
//       count = productData.length;
//     } else {
//       productData = await productModel
//         .find({
//           title: new RegExp(search, "i"),
//           category: category,
//         })
//         .sort({ uploadedAt: -1 })
//         .skip(page * 9)
//         .limit(9)
//         .lean();
//       count = productData.length;
//     }
//   } else {
//     if (category.length != 24) {
//       productData = await productModel
//         .find({
//           title: new RegExp(search, "i"),
//         })
//         .sort({ uploadedAt: -1 })
//         .skip(page * 9)
//         .limit(9)
//         .lean();
//       count = productData.length;
//     } else {
//       productData = await productModel
//         .find({
//           title: new RegExp(search, "i"),
//           category: category,
//         })
//         .sort({ price: filter })
//         .skip(page * 9)
//         .limit(9)
//         .lean();
//       count = productData.length;
//     }
//   }
//   let pageCount = Math.ceil(count / 9) + 1;
//   let pagesCount = [];
//   for (let i = 0; i < pageCount; i++) {
//     pagesCount.push(i);
//   }
//   console.log("cat",category,'cdata',categoryData,"cccccccccc");
//   console.log(pagesCount);
//   return res.render("user/pagination", {
//     productData,
//     categoryData,
//     search,
//     category,
//     filter,
//     pagesCount,
//     page,
//     isLoggedIn,
//   });
//   // res.render('user/pagination',{productData,categoryData})
// }

export async function shop(req, res) {
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
      { _id: category },
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
  console.log(sort,'sort');
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
  });
  // }
  //  catch (err) {
  //   res.send(err);
  // }

  // try{
  // console.log(req.query.category,'852452');
  //   const categoryData = await categoryModel.find().lean();
  //   const category = req.query.category ?? "";
  //   req.session.findCat=category?category:req.session.findCat??""
  //   console.log(req.session.findCat,'12345798');
  //   const search = req.query.search ?? "";
  //   const filter = req.query.filter ?? "";
  //   const page = req.query.page ?? 0;
  //   let count = 0;
  //   let productData = [];
  // if (req.session.findCat.length!=24) {
  //   productData=await productModel.find()
  // }
  //  else {
  //    productData=await productModel.find({category:req.session.findCat})
  //    console.log(productData,'proooooooooooooooooooooooooooo');
  // }
  // if (filter == 0) {
  //   if (category.length != 24) {
  //     productData = await productModel
  //       .find({
  //         title: new RegExp(search, "i"),
  //       })
  //       .sort({ uploadedAt: -1 })
  //       .skip(page * 9)
  //       .limit(9)
  //       .lean();
  //     count = productData.length;
  //   } else {
  //     productData = await productModel
  //       .find({
  //         title: new RegExp(search, "i"),
  //         category: category,
  //       })
  //       .sort({ uploadedAt: -1 })
  //       .skip(page * 9)
  //       .limit(9)
  //       .lean();
  //     count = productData.length;
  //   }
  // } else {
  //   if (category.length != 24) {
  //     productData = await productModel
  //       .find({
  //         title: new RegExp(search, "i"),
  //       })
  //       .sort({ uploadedAt: -1 })
  //       .skip(page * 9)
  //       .limit(9)
  //       .lean();
  //     count = productData.length;
  //   } else {
  //     productData = await productModel
  //       .find({
  //         title: new RegExp(search, "i"),
  //         category: category,
  //       })
  //       .sort({ price: filter })
  //       .skip(page * 9)
  //       .limit(9)
  //       .lean();
  //     count = productData.length;
  //   }
  // // }
  // let pageCount = Math.ceil(count / 9) + 1;
  // let pagesCount = [];
  // for (let i = 0; i < pageCount; i++) {
  //   pagesCount.push(i);
  // }
  // for(let i=0;i<categoryData.length;i++){
  //   if(categoryData[i]._id==category){
  //     category=categoryData[i]
  //   }
  // }
  // let selectedCategory = category; // Store the selected category ID in a variable
  // let cid = categoryData._id;
  // console.log("cid: ", cid, "category", category);
  // return res.render("user/pagination", {
  //   productData,
  //   categoryData,
  //   search,
  //   category, // Pass the selected category ID to the template
  //   filter,
  //   pagesCount,
  //   page,
  //   isLoggedIn,
  // });
  // }
  // catch (error) {
  //   console.error("Error getting shopping page:", error);
  //   res.status(500).send("Internal server error");
  // }
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
    // const sumOfQuantity = orders.product.reduce((accumulator, product) => {
    //   return accumulator + product.quantity;
    // }, 0);
    // qqq.product.map((item)=>{
    //   tQty=tQty+item.quantity
    // })
    for (let order of orders) {
      // let productQty = 0;
      for (let product of order.product) {
        productQty += product.quantity;
      }
      // console.log(`Order ${order._id} has ${productQty} products`);
    }
    // let oo=orders.product
    console.log(orders, "orders", productQty);
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
    let name =(user.name).toUpperCase();
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
export async function getEditAddress(req,res){
  try {
    let { address } = await userModel.findOne(
      { "address.id": req.params.id },
      { _id: 0, address: { $elemMatch: { id: req.params.id } } }
    );
  
    console.log(address,"addagagh");
    res.render('user/editProfile',{address})
    
  } catch (error) {
    console.log(error);
  }
}

export async function editAddress(req, res) {
  console.log('gfhdgdggdn');
  try {
    await userModel.updateOne(
      { _id: req.session.user.id, address: { $elemMatch: { id: req.body.id } } },
      {
        $set: {
          "address.$": req.body,
        },
      }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error while submiting address:", error);
    res.status(500).send("Internal server error");
    res.redirect("/profile");
  }
}

export async function deleteAddress(req, res) {
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
}

// export async function editProfile(req,res){
//   const id = req.session.user.id;
//   const {name,email}=req.body

//   let Profile = await userModel.findByIdAndUpdate(
//     id,
//     { name,
//     email
//    },
//     {
//       new: true,
//     })
// }

export async function getOrderDetails(req, res) {
  try {
    const userId = req.session.user.id;
    const orderId = req.params.orderId;

    let order = await orderModel
      .find({ userId: userId, orderId: orderId })
      .lean();
    console.log("order d", order);
    res.render("user/orderDetails", { order, isLoggedIn });
  } catch (error) {
    console.error("Error while getting product details:", error);
    res.status(500).send("Internal server error");
  }
}
export async function sample(req,res){
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
      { _id: category },
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
  console.log(sort,'sort');
  let categoryData = await categoryModel.find({ list: true }).lean();
  let pageCount = Math.ceil(productCount / 9);
  let pagesCount = [];
  for (let i = 0; i < pageCount; i++) {
  pagesCount.push(i);
  }
  res.render("user/sample", {
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
  });
}
