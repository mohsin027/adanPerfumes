import userModel from "../model/userModel.js";
import productModel from "../model/productModel.js";
import categoryModel from "../model/categoryModel.js";
import couponModel from "../model/couponModel.js";
import moment from "moment-timezone";
import upload from "../middlewares/multer.js";
import bcrypt from "bcryptjs";
import orderModel from "../model/orderModel.js";
import { Chart } from "chart.js";

let isLoggedInAdmin;
let adminloginError;
let categoryExistError;
let couponExistError;