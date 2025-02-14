const { Router } = require("express");
const User = require("../models/user");

const router = Router();

router.get("/signin", (req, res) => {
  res.render("signin", { user: req.user }); 
});

router.get("/signup", (req, res) => {
  res.render("signup", { user: req.user }); 
});

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const user = await User.create({ fullName, email, password });
    return res.redirect("/user/signin");
  } catch (error) {
    return res.render("signup", { error: error.message, user: req.user });
  }
});

router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await User.matchPassword(email, password);

    res.cookie("token", token, { httpOnly: true, secure: false });
    return res.redirect("/");
  } catch (error) {
    return res.render("signin", { error: error.message, user: req.user });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.locals.user = null;
  return res.redirect("/");
});

module.exports = router;
