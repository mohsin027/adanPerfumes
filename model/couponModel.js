import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    code:{
        type:String,
        required:true
    },
    discountValue:{
        type:Number,
        required:true
    },
    minSaleValue:{
        type:String,
        required:true
    },
    expiryDate:{
        type:Date,
        required:true
    },
    list:{
        type:Boolean,
        default:true
    }
});

const couponModel = mongoose.model('coupon', couponSchema);
export default couponModel