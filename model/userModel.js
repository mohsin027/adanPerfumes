import mongoose, { mongo } from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'name required'],
    },
    email:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true
    },
    block:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    address:{
        type:Array,
        default:[]
    },
    cart:{
        type:Array,
        default:[]
    },
    wishlist:{
        type:Array,
        default:[]
    }
});

const userModel = mongoose.model('user', userSchema);
export default userModel