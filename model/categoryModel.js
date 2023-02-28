import mongoose, { mongo } from "mongoose";

const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:[true, 'name required'],
    },
    list:{
        type:Boolean,
        default:true
    }
});

const categoryModel = mongoose.model('category', categorySchema);
export default categoryModel