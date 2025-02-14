const { createHmac, randomBytes } = require("crypto");
const { Schema, model } = require("mongoose");
const{createTokenForUser}=require("../service/authentication");

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    salt: {
        type: String,
        
    },
    password: {
        type: String,
        required: true,
    },
    profileImageURL: {
        type: String,
        default: "../public/default.png",
    },
    role:{
        type:String,
        default:"User",

    }
}, { timestamps: true });

userSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = randomBytes(16).toString("hex"); 
        this.salt = salt; 
        this.password = createHmac("sha256", salt).update(this.password).digest("hex"); // Hash password with salt

        next(); 
    } catch (error) {
        next(error); 
    }
});

userSchema.statics.matchPassword = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) throw new Error("User not found!");

    const userProvidedHash = createHmac("sha256", user.salt)
        .update(password) 
        .digest("hex");

    if (user.password !== userProvidedHash) throw new Error("Incorrect Password");

    const token=createTokenForUser(user);
    return {user,token};
    
};

const User = model("user", userSchema);
module.exports = User;
