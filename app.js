//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require('mongoose');
const homeStartingContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. ";
const aboutContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. ";
const contactContent = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. ";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-lakshay:Aayushbatra1@@cluster0-qgflw.mongodb.net/blogsDB", { useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true });

const blogSchema = {
  title: {
    type: String,
    required:true
  },
  content:String
};
const Blog = mongoose.model("Blog",blogSchema);

app.get("/", function (req, res) {

  Blog.find((err,foundBlogs) => {
    if(!err) {
      if(foundBlogs.length==0) {
        const tempBlog = new Blog ({
          title:"Demo Title",
          content:"demo content"
        });
        tempBlog.save();
        setTimeout(() => {
          res.redirect("/");
        },500);
        
      } else {
        res.render("home", {
          startingContent: homeStartingContent,
          posts: foundBlogs
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent });
});

app.get("/compose", function (req, res) {
  res.render("compose");
});

app.post("/compose", function (req, res) {

  var inputTitle= req.body.postTitle;
  const inputContent= req.body.postBody;
  // if(_.endsWith(inputTitle," ")) {
  //   inputTitle=_.trimEnd(inputTitle);
  // }
  const newBlog = new Blog({
    title: inputTitle,
    content: inputContent
  });
  newBlog.save();
  res.redirect("/");

});

app.get("/posts/:postName", function (req, res) {
  const requestedTitle = req.params.postName;

  Blog.findOne({title: requestedTitle},(err,foundBlog) => {
    if(!err) {
      res.render("post",{
        title: foundBlog.title,
        content: foundBlog.content,
        id: foundBlog._id
      });
    }
  });

});

app.post("/delete", (req,res) => {
  const id = req.body.delete;
  Blog.findByIdAndRemove(id, (err) => {
    if(!err) {
      res.redirect("/");
    }
  })
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
