import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:[true, 'title required'],
    },
    desc:{
        type:String,
    },   
    mainImage:{
        type:Object
        
    },
    sideImages:{
        type: Array
        
    },
    stock:{
        type:Number,
        required:true,
        default:1
    },
    category:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category' ,
        required:true
    },
    MRP:{
        type:Number,
        
    },
    price:{
        type:Number,
        required:true,
        
    },
    list:{
        type:Boolean,
        default:true
    },
    uploadedAt:{
        type:Date,
        default:new Date()
    },
    reviews:{
        type:Array,
        default:[]
    }
});

const productModel = mongoose.model('product', productSchema);
export default productModel