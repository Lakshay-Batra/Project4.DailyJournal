require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');
const description = require(__dirname + "/description.js");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_CLUSTER_LINK, { useCreateIndex: true, useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true });

const blogSchema = new mongoose.Schema({
  title: String,
  content: String
});
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  blogs: [blogSchema]
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
const Blog = mongoose.model("Blog", blogSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//////////////////////////////////////////////// Login-Logout and Registration //////////////////////////////////////
app.get("/", (req, res) => {
  res.render("landing-page");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/register", (req, res) => {
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.username;
  const password = req.body.password;
  User.register({ username: email, email: email, firstName: firstName, lastName: lastName }, password, function (err, user) {
    if (err) {
      res.render("register", { failureMessage: err.message });
    } else {
      passport.authenticate("local", { failureRedirect: "/register", failureFlash: { type: 'error', message: 'User already Registered.' } })(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function (err) {
    if (err) {
      console.error(err.message);
      res.redirect("/login");
    } else {
      passport.authenticate("local", { failureRedirect: "/login", failureFlash: { type: 'error', message: 'Invalid Username or Password.' } })(req, res, function () {
        res.redirect("/home");
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

////////////////////////////////////////////////////// Secondary routes //////////////////////////////////////////

app.get("/about", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("about", { aboutContent: description.about() });
  } else {
    res.redirect("/login");
  }
});

app.get("/contact", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("contact", { contactContent: description.contact() });
  } else {
    res.redirect("/login");
  }
});

///////////////////////////////////////////////////// /home route ///////////////////////////////////////////////////

app.get("/home", function (req, res) {
  if (req.isAuthenticated()) {
    User.findOne({ _id: req.user._id }, (err, foundUser) => {
      if (!err) {
        if (foundUser) {
          if (foundUser.blogs.length == 0) {
            const tempBlog = new Blog({
              title: "Demo Title",
              content: "Hit + button to write your daily journal."
            });
            tempBlog.save((err) => {
              if(!err) {
                foundUser.blogs.push(tempBlog);
                foundUser.save((err) => {
                  res.redirect("/home");
                });
              }
            });
          } else {
            res.render("home", {
              startingContent: description.home(),
              posts: foundUser.blogs
            });
          }
        }
      }
    });
    // Blog.find((err, foundBlogs) => {
    //   if (!err) {
    //     if (foundBlogs.length == 0) {
    //       const tempBlog = new Blog({
    //         title: "Demo Title",
    //         content: "demo content"
    //       });
    //       tempBlog.save();
    //       setTimeout(() => {
    //         res.redirect("/home");
    //       }, 500);

    //     } else {
    //       res.render("home", {
    //         startingContent: description.home(),
    //         posts: foundBlogs
    //       });
    //     }
    //   }
    // });
  } else {
    res.redirect("/login");
  }
});

/////////////////////////////////////////////////// compose route ////////////////////////////////////////////////

app.get("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("compose");
  } else {
    res.redirect("/login");
  }
});

app.post("/compose", function (req, res) {
  if (req.isAuthenticated()) {
    var inputTitle = req.body.postTitle;
    const inputContent = req.body.postBody;
    if (_.endsWith(inputTitle, " ") || _.startsWith(inputTitle, " ")) {
      _.trim(inputTitle);
    }
    if (_.endsWith(inputContent, " ") || _.startsWith(inputContent, " ")) {
      _.trim(inputContent);
    }
    const newBlog = new Blog({
      title: inputTitle,
      content: inputContent
    });
    newBlog.save((err) => {
      if (!err) {
        User.findOneAndUpdate({ _id: req.user._id }, { $push: { blogs: newBlog } }, (err) => {
          if (!err) {
            res.redirect("/home");
          }
        });
      }
    });
  } else {
    res.redirect("/login");
  }

});

///////////////////////////////////////////////////// /posts/12314342 route /////////////////////////////////////

app.get("/posts/:postId", function (req, res) {
  if (req.isAuthenticated()) {
    const requestedId = req.params.postId;

    Blog.findOne({ _id: requestedId }, (err, foundBlog) => {
      if (!err) {
        res.render("post", {
          title: foundBlog.title,
          content: foundBlog.content,
          id: foundBlog._id
        });
      }
    });
  } else {
    res.redirect("/login");
  }

});

/////////////////////////////////////////////// delete route ///////////////////////////////////////////////////

app.post("/delete", (req, res) => {
  if (req.isAuthenticated()) {
    const id = req.body.delete;
    Blog.findByIdAndRemove(id, (err) => {
      if (!err) {
        User.findOneAndUpdate({ _id: req.user._id }, { $pull: { blogs: { _id: id } } }, (err) => {
          if (!err) {
            res.redirect("/home");
          }
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
