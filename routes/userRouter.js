import express from 'express'
import { addToCart, deleteFromCart, emailCheckResetPassword, getOtpPage, getResetPage, getSignupOtp, homePage, resetPassword, signup, signupOtp, userForgetPassPage, userLogin, userLoginPage, userLogout, userSignupPage, verifyOTP } from '../controllers/userController.js'
import verifyUser from '../middlewares/verifyUser.js'
const router = express.Router()




router.get('/login', userLoginPage)
router.post('/login', userLogin)
router.get('/signup', userSignupPage)
router.post('/signup', signup)
router.get('/signupOtp',getSignupOtp )
router.post('/otpSubmitSignup',signupOtp )
router.get('/',homePage)
router.get('/logout', userLogout)


router.get('/forgetPassword', userForgetPassPage)
router.post('/emailSubmit', emailCheckResetPassword)
router.get('/getOtpPage', getOtpPage)
router.post('/otpSubmit', verifyOTP)
router.get('/getResetPage', getResetPage)
router.post('/passwordSubmit', resetPassword)
// router.post('/resetPassword', resetPassword)



router.get('/addToCart/:id',verifyUser, addToCart)
router.get('/deleteFromCart/:id',verifyUser, deleteFromCart)





export default router