const { Router } = require("express")
const User = require("../models/user")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const multer = require("multer")
const path = require("path")

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve("./public/uploads/")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})
const upload = multer({ storage })

router.get("/signin", (req, res) => {
  res.render("signin", { user: req.user })
})

router.get("/signup", (req, res) => {
  res.render("signup", { user: req.user })
})

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body
    const user = await User.create({ fullName, email, password })
    return res.redirect("/user/signin")
  } catch (error) {
    return res.render("signup", { error: error.message, user: req.user })
  }
})

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body
    const { user, token } = await User.matchPassword(email, password)
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    return res.redirect("/")
  } catch (error) {
    return res.render("signin", { error: error.message, user: req.user })
  }
})

router.get("/logout", (req, res) => {
  res.clearCookie("token")
  return res.redirect("/")
})

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { user: req.user })
})

router.post("/forgot-password", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.render("forgot-password", { error: "No account with that email address exists.", user: req.user })
    }

    const token = crypto.randomBytes(20).toString("hex")
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hour
    await user.save()

    const transporter = nodemailer.createTransport({
      // Configure your email service here
      // For example, using Gmail:
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      to: user.email,
      from: "noreply@blogify.com",
      subject: "Password Reset",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                Please click on the following link, or paste this into your browser to complete the process:\n\n
                http://${req.headers.host}/user/reset/${token}\n\n
                If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    }

    await transporter.sendMail(mailOptions)
    res.render("forgot-password", {
      message: "An e-mail has been sent to " + user.email + " with further instructions.",
      user: req.user,
    })
  } catch (error) {
    console.error("Error in forgot password:", error)
    res.render("forgot-password", { error: "An error occurred. Please try again later.", user: req.user })
  }
})

router.get("/reset/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.render("reset", { error: "Password reset token is invalid or has expired.", user: req.user })
    }
    res.render("reset", { token: req.params.token, user: req.user })
  } catch (error) {
    console.error("Error in reset password get:", error)
    res.render("reset", { error: "An error occurred. Please try again later.", user: req.user })
  }
})

router.post("/reset/:token", async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.render("reset", { error: "Password reset token is invalid or has expired.", user: req.user })
    }
    if (req.body.password === req.body.confirm) {
      user.password = req.body.password
      user.resetPasswordToken = undefined
      user.resetPasswordExpires = undefined
      await user.save()
      res.redirect("/user/signin")
    } else {
      res.render("reset", { error: "Passwords do not match.", token: req.params.token, user: req.user })
    }
  } catch (error) {
    console.error("Error in reset password post:", error)
    res.render("reset", {
      error: "An error occurred. Please try again later.",
      token: req.params.token,
      user: req.user,
    })
  }
})

router.get("/profile", (req, res) => {
  if (!req.user) return res.redirect("/user/signin")
  res.render("profile", { user: req.user })
})

router.post("/profile", upload.single("profileImage"), async (req, res) => {
  try {
    if (!req.user) return res.redirect("/user/signin")
    const user = await User.findById(req.user._id)
    if (req.file) {
      user.profileImageURL = `/uploads/${req.file.filename}`
    }
    if (req.body.fullName) {
      user.fullName = req.body.fullName
    }
    await user.save()
    res.redirect("/user/profile")
  } catch (error) {
    console.error("Error updating profile:", error)
    res.status(500).send("Internal Server Error")
  }
})

router.post("/super-admin-signin", async (req, res) => {
  try {
    const { email, password, superAdminKey } = req.body
    if (superAdminKey !== process.env.SUPER_ADMIN_KEY) {
      throw new Error("Invalid Super Admin Key")
    }
    const { user, token } = await User.matchPassword(email, password)
    if (user.role !== "SuperAdmin") {
      throw new Error("Not authorized as Super Admin")
    }
    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" })
    return res.redirect("/")
  } catch (error) {
    return res.render("super-admin-signin", { error: error.message, user: req.user })
  }
})

router.get("/super-admin-signin", (req, res) => {
  res.render("super-admin-signin", { user: req.user })
})

module.exports = router

