const path = require("path")
const express = require("express")
const cookieParser = require("cookie-parser")
const mongoose = require("mongoose")
const userRoute = require("./routes/user")
const blogRoute = require("./routes/blog")
const { validateToken } = require("./service/authentication")
const { checkForAuthenticationCookie } = require("./middlewares/authentication")
const Blog = require("./models/blog")

const app = express()
const port = 8000

mongoose
  .connect("mongodb://127.0.0.1:27017/blogify")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err))

app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))

app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cookieParser())
app.use(checkForAuthenticationCookie("token"))
app.use(express.static(path.resolve("./public")))

app.use((req, res, next) => {
  const token = req.cookies.token
  res.locals.user = token ? validateToken(token) : null
  req.user = res.locals.user
  next()
})

app.get("/", async (req, res) => {
  try {
    const allBlogs = await Blog.find({}).populate("createdBy", "fullName")
    res.render("home", { user: req.user, blogs: allBlogs })
  } catch (error) {
    console.error("Error fetching blogs:", error)
    res.status(500).send("Internal Server Error")
  }
})

app.use("/user", userRoute)
app.use("/blog", blogRoute)

app.listen(port, () => {
  console.log(`Server Started at port:${port}`)
})

