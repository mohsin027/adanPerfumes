let isLoggedInAdmin=false
export default function verifyAdmin(req, res, next) {
  // console.log("Admin = ",req.session.admin);
  if (req.session.admin) {
    isLoggedInAdmin=true
    next();
  } else {
    // res.json({ message: "please login" });
    res.redirect('/admin')
    isLoggedInAdmin=false
  }
}
