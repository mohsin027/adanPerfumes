import express from "express"
import dbConnect from "./config/dbConnect.js"
import userModel from "./model/userModel.js"
import adminRouter from "./routes/adminRouter.js"
import userRouter from "./routes/userRouter.js"
import session from "express-session"
import * as dotenv from 'dotenv' 
dotenv.config()

import {engine} from 'express-handlebars';
import verifyUser from "./middlewares/verifyUser.js"
import logger from "morgan"
import path from 'path'
import hbs from 'handlebars'
import moment from "moment-timezone"


const app=express()

hbs.registerHelper('formatDate', function(date, format) {
    moment.locale('en');
    return moment(date).tz('Asia/Kolkata').format(format);
  });
const __dirname=path.resolve()
app.engine('hbs', engine({extname:".hbs"}));
app.set('view engine','hbs')
app.use(express.static(__dirname+"/public"))
app.use(logger('dev'))


app.use(express.urlencoded({extended:true}))
app.use(express.json())



app.use(session({
    secret: 'super secret key',
    resave: true,
    cookie: { maxAge: 8*60*60*1000 },  // 8 hours
    saveUninitialized: true
}));

dbConnect();

app.use('/admin',adminRouter)
app.use('/', userRouter)

hbs.registerHelper("inc",function(value,options){
    return parseInt(value)+1;
})

// app.get("/add",async (req, res)=>{
//     try{
//         let user=await userModel.create({name:"mohsin", email:"ab", password:"jhekj"});
//         res.json(user)
//     }catch(err){
//         console.log(err)
//         res.json(err)
//     } 
// })
// app.get("/read",async (req, res)=>{
//     try{
//         let user=await userModel.find().lean()
//         res.json(user)
//     }catch(err){
//         console.log(err)
//         res.json(err)
//     }
// })
// app.get("/update",async (req, res)=>{
//     try{
//         let user=await userModel.updateOne({email:"ab"},{$set:{name:"fasil"}})
//         res.json(user)
//     }catch(err){
//         console.log(err)
//         res.json(err)
//     }
// })
// app.get("/delete",async (req, res)=>{
//     try{
//         let user=await userModel.deleteMany({email:"jhcekjhkje"})
//         res.json(user)
//     }catch(err){
//         console.log(err)
//         res.json(err)
//     }
// })
// app.use((req, res) => {
//     res.status(404).send('Page not found!');
//   });

app.listen(5000,()=>{
    console.log(`server started on 5000`)
})


