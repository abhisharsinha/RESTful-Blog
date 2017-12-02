const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const app = express();


// app config
mongoose.connect("mongodb://localhost/rest_blog");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());

// mongoose/model config
var blogSchema = new mongoose.Schema({
  title: String,
  image: String,
  body: String,
  created: {type: Date, default: Date.now}
});

var userSchema = new mongoose.Schema({
  username: String,
  password: String
});

var Blog = mongoose.model("Blog", blogSchema);
var User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.redirect("/blogs");
});

// Index
app.get("/blogs", function (req, res) {
  Blog.find({}, function (err, blogs) {
    if (err) {
      console.log("Oops");
    } else {
      res.render("index", {blogs: blogs});
    }
  })
  console.log("Index");
});

// New
app.get("/blogs/new", function (req, res) {
  res.render("new");
});

// create
app.post("/blogs", function (req, res) {
  let blog = req.body.blog;
  console.log(blog.body);
  blog.body = req.sanitize(blog.body);
  console.log(blog.body);
  Blog.create(blog, function (err, newBlog) {
    if (err) {
      console.log("OOps");
      res.render("new");
    } else {
      res.redirect("/blogs");
    }
  })
});

// show
app.get("/blogs/:id", function (req, res) {
  console.log("Show");
  let id = req.params.id;
  Blog.findById(id, function (err, blog) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.render("show", {blog: blog});
    }
  })
});

// Edit
app.get("/blogs/:id/edit", function (req, res) {
  let id = req.params.id;
  Blog.findById(id, function (err, blog) {
    if (err) {
      console.log("Blog post does not exits");
      res.redirect("/blogs");
    } else {
      res.render("edit", {blog: blog});
    }
  })
});

// Update
app.put("/blogs/:id", function (req, res) {
  Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
    if (err) {
      console.log("OOps");
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs/"+req.params.id);
    }
  })
});

// Delete
app.delete("/blogs/:id", function (req, res) {
  Blog.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  });
});



app.listen(3000, "localhost", function () {
  console.log("Listening on port 3000");
});
