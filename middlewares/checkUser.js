import userModel from "../model/userModel.js";

export default async function(req, res, next){
    if(req.session.user){
        const user= await userModel.findOne({_id:req.session.user.id}/*, {password:0}*/);
        req.user=user;
        if(user?.block){
            req.session.user=null;
            let loginError="blocked"
            return res.render("user/login",{loginError})
            loginError=null
        }
    }
    next();
}
