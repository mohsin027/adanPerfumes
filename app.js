import express from "express"
import dbConnect from "./config/dbConnect.js"
import userModel from "./model/userModel.js"
import adminRouter from "./routes/adminRouter.js"
import userRouter from "./routes/userRouter.js"
import session from "express-session"
import MongoStore from 'connect-mongo'
import dotenv from 'dotenv'
dotenv.config()
import pageNotFound from "./middlewares/pageNotFound.js"

import verifyUser from "./middlewares/verifyUser.js"
import {engine} from 'express-handlebars';
import logger from "morgan"
import path from 'path'
import hbs from 'handlebars'
import moment from "moment-timezone"
import cors from 'cors'


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

app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use((req,res,next)=>{
    res.header('Cache-Control', 'no-cache,  no-store, must-revalidate, ');
    next()
    })

app.use(session({
    secret: 'super secret key',
     resave: true,
    cookie: { maxAge: 8*60*60*1000 },
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.DB_URL })
    
}));

dbConnect();

app.use('/admin',adminRouter)
app.use('/', userRouter)

app.use(pageNotFound)



hbs.registerHelper("inc",function(value,options){
    return parseInt(value)+1;
})
hbs.registerHelper('ifEqual', function (a, b, opts) {
    if (a === b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });
  
  hbs.registerHelper('unlessEqual', function (a, b, opts) {
    if (a !== b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });
  app.use(function (err, req, res, next) {
    if (err instanceof multer.MulterError) {
      res.status(400).send('File size should not exceed 5 MB and max image limit is 12');
    } else {
      next(err);
      res.redirect('/cart')
    }
  });
 

const port=process.env.PORT

app.listen(port,()=>{
    console.log(`server started on ${port}`)
})


