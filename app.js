const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const passport = require('passport');
const localStrategy = require('passport-local');
const expressSession = require('express-session');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();


// app config
mongoose.connect("mongodb://localhost/rest_blog");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());

// mongoose/model config

var userSchema = new mongoose.Schema({
  name: String,
  username: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", userSchema);

var blogSchema = new mongoose.Schema({
  title: String,
  image: String,
  body: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  },
  created: {type: Date, default: Date.now}
});
var Blog = mongoose.model("Blog", blogSchema);

app.use(expressSession({
  secret: "mysecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// ROUTES
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
app.get("/blogs/new", isLoggedIn, function (req, res) {
  res.render("new");
});

// create
app.post("/blogs", isLoggedIn, function (req, res) {
  let blog = {title: req.body.blog.title, image: req.body.blog.image};
  console.log(req.body.blog.body);
  blog.body = req.sanitize(req.body.blog.body);
  let author = {
    username: req.user.username,
    id: req.user._id
  };
  blog.author = author;
  console.log(blog);
  Blog.create(blog, function (err, newBlog) {
    if (err) {
      console.log(err);
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
app.get("/blogs/:id/edit", checkAuthor, function (req, res) {
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
app.put("/blogs/:id", checkAuthor, function (req, res) {
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
app.delete("/blogs/:id", checkAuthor, function (req, res) {
  Blog.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect("/blogs");
    } else {
      res.redirect("/blogs");
    }
  });
});

// Adding login routes
app.get("/signup", function (req, res) {
  res.render("signup");
});

app.post("/signup", function (req, res) {
  let user = req.body.user;
  User.register(new User({name: user.name, username: user.username}), user.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/signup");
    } else {
      console.log(user);
      passport.authenticate();
      res.redirect("/blogs");
    }
  });
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/login", passport.authenticate("local", {failureRedirect: "/login", successRedirect: "/blogs"}), function (req, res) {
  res.render("blogs");
});

app.get("/logout", function (req, res) {
  console.log("Logged Out");
  req.logout();
  res.redirect("/blogs");
});


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

function checkAuthor(req, res, next) {
  if (req.isAuthenticated()) {
    Blog.findById(req.params.id, function (err, blog) {
      if (err) {
        console.log(err);
        res.redirect("/blogs");
      } else {
        if (blog.author.id.equals(req.user._id)) {
          next();
        } else {
          res.redirect("/login");
        }
      }
    });
  }
}

// Start the server
app.listen(3000, "localhost", function () {
  console.log("Listening on port 3000");
});
