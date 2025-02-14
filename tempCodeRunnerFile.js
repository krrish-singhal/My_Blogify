const path=require("path");
const express=require("express");
const app=express();
const mongoose=require("mongoose");
const userRoute=require("./routes/user");
const port=8000;

mongoose.connect("mongodb://127.0.0.1:27017/blogify")
.then((e)=>console.log("MongoDB Connected"));

app.set("view engine","ejs");
app.set("views",path.resolve("./views"));

app.use(express.urlencoded({extended:false}))


app.get("/",(req,res)=>{
    res.render("home")
})
app.use("/user",userRoute);


app.listen(port,()=>console.log(`Server Started at port:${port}`));