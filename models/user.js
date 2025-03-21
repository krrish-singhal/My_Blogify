const { createHmac, randomBytes } = require("crypto")
const { Schema, model } = require("mongoose")
const { createTokenForUser } = require("../service/authentication")

const userSchema = new Schema(
  {
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
      default: "/default.png",
    },
    role: {
      type: String,
      enum: ["User", "Admin", "SuperAdmin"],
      default: "User",
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true },
)

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = randomBytes(16).toString("hex")
    this.salt = salt
    this.password = createHmac("sha256", salt).update(this.password).digest("hex")
    next()
  } catch (error) {
    next(error)
  }
})

userSchema.statics.matchPassword = async function (email, password) {
  const user = await this.findOne({ email })
  if (!user) throw new Error("User not found!")

  const userProvidedHash = createHmac("sha256", user.salt).update(password).digest("hex")

  if (user.password !== userProvidedHash) throw new Error("Incorrect Password")

  const token = createTokenForUser(user)
  return { user, token }
}

userSchema.statics.createSuperAdmin = async function (email, password, fullName) {
  const superAdmin = await this.findOne({ role: "SuperAdmin" })
  if (superAdmin) {
    throw new Error("Super Admin already exists")
  }
  return this.create({ email, password, fullName, role: "SuperAdmin" })
}

const User = model("user", userSchema)
module.exports = User

