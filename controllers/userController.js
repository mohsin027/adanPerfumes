import userModel from "../model/userModel.js";

let isLoggedIn = false;
let users = "";
let signupError;
let loginError;
let otpError;

export async function homePage(req, res) {
  if (req.session.user) {
    isLoggedIn = true;
    res.render("user/index", { isLoggedIn });
  }
  isLoggedIn = false;
  res.render("user/index");
}
export async function userSignupPage(req, res) {
  res.render("user/signup", { signupError });
  signupError = null;
}
export async function signup(req, res) {
  req.session.tempUser = req.body;
  const exiUser = await userModel.findOne({ email: req.body.email });
  if (!exiUser) {
    res.render("user/signupOtp");
  } else {
    signupError = "Email already exist. Please go to login";
    res.redirect("/signup");
  }
}
export async function signupOtp(req,res) {
  let OTP = req.body.OTP;
  const user = req.session.tempUser;

  if (OTP == 1234) {
    console.log("otp:" + OTP);
    let newUser = await userModel.create(user)
    console.log("signup:" + user);
    res.redirect("/login");
  } else {
    otpError = "OTP not valid";
    res.redirect("/signupOtp");
  }
}
export async function getSignupOtp(req, res) {
  res.render("user/signupOtp", { otpError });
  otpError = null;
}

export async function userLoginPage(req, res) {
  res.render("user/login", { loginError });
  loginError = null;
}

export async function userLogin(req, res, next) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  isLoggedIn = true;
  console.log("user:" + user);
  if (user) {
    if (password == user.password) {
      req.session.user = {
        id: user._id,
      };

      res.render("user/index", { isLoggedIn });
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
  console.log(req.session.user);
}
export async function userLogout(req, res) {
  req.session.user = null;
  isLoggedIn = false;
  res.redirect("/");
}

export async function userForgetPassPage(req, res) {
  res.render("user/forgetPassword");
}

export async function emailCheckResetPassword(req, res) {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  console.log(user);
  if (!user) {
    res.redirect("/forgetPassword");
  } else {
    req.session.userId = user._id;
    console.log(user._id);
    res.render("user/otpPage");
  }
}

export async function verifyOTP(req, res) {
  if (req.body.OTP == 1234) {
    console.log(req.body);
    res.render("user/resetPassword");
  } else {
    console.log("no OTP");
    res.redirect("/getOtpPage");
  }
}
export async function getOtpPage(req, res) {
  res.render("user/otpPage");
}
export async function getResetPage(req, res) {
  res.render("user/resetPassword");
}

export async function resetPassword(req, res) {
  let userId = req.session.userId;
  const { password, confirmPassword } = req.body;
  // const user = await userModel.findOne({userId });
  if (password == confirmPassword) {
    console.log("Password Match");
    let editedPassword = await userModel.findByIdAndUpdate(userId, password, {
      new: true,
    });
    res.redirect("/login");
  } else {
    console.log("Password not match");
    res.redirect("/getResetPage");
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
  res.json({ message: "added " + proId + " to " + id });
}

export async function deleteFromCart(req, res) {
  const id = "63f0766929b3e50451d2b1a9";
  const proId = req.params.id;
  await userModel.updateOne(
    { id },
    {
      $pull: {
        cart: { id: proId },
      },
    }
  );
  res.json({ message: "deleted " + proId + " from " + id });
}
