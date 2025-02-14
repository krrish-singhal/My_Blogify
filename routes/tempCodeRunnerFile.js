const {Router}=require("express");
const User=require("../models/user")

const router=Router();

router.get("/signin",(req,res)=>{
    res.render("signin");
})

router.get("/signup",(req,res)=>{
    res.render("signup");
})


router.post("/signin",async(req,res)=>{
    const {email,password}=req.body;
    const user=await User.matchPassword(email,password);
    if(!user){
        console.log( "user not found");
        return res.redirect("/signup")
    }

    console.log("User",user);
    return res.redirect("/signin");

})

router.post("/signup",async(req,res)=>{
    const{fullname,email,password}=req.body;
    const isMatched= await User.matchPassword(email,password);
    await User.create({
        fullname,
        email,
        password,
});
return res.redirect("/");
});

module.exports=router;

