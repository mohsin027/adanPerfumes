let isLoggedIn;
let userName;
export default function verifyUser(req, res, next) {
  console.log("User = ",req.session.user);
  if (req.session.user) {
    isLoggedIn=true
    userName=req.session.user.name
    next();
  } else {
    res.redirect('/login')
    isLoggedIn=false
    userName=null;
  }
}
