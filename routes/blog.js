const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const Blog = require("../models/blog");
const Comment = require("../models/comments");
const User = require("../models/user");
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.resolve("./public/uploads/")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.get("/add-new", (req, res) => {
  if (!req.user) return res.redirect("/user/signin");
  res.render("addblog", { user: req.user });
});

router.post("/add-new", upload.single("coverImage"), async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.render("addblog", { user: req.user, error: "Title and Body are required." });
    }
    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageURL: req.file ? `/uploads/${req.file.filename}` : ""
    });
    res.redirect("/");
  } catch (error) {
    console.error("Error adding blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy", "fullName profileImageURL");
    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy", "fullName");
    if (!blog) return res.status(404).send("Blog not found.");
    res.render("blog", { user: req.user, blog, comments });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/comment/:blogId", async (req, res) => {
  try {
    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id
    });
    res.redirect(`/blog/${req.params.blogId}`);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/:id/delete", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).send("Blog not found.");
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send("Not authorized to delete this blog.");
    }
    await blog.remove();
    res.redirect("/");
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
