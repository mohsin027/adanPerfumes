let isLoggedIn=false
export default function verifyUser(req, res, next) {
  console.log("User = ",req.session.user);
  if (req.session.user) {
    isLoggedIn=true
    next();
  } else {
    // res.json({ message: "please login" });
    res.redirect('/login')
    isLoggedIn=false
  }
}
