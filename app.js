const express =  require("express");
const app = express();
const bcrypt = require("bcrypt");
const cookieParser  = require("cookie-parser");
const userModel = require("./models/user");
const postModel = require("./models/post")
const path = require("path");
const jwt = require("jsonwebtoken");
const upload = require("./config/multerconfig");

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res)=>{
  res.render("index");
});

app.get("/profile/upload", isLoggedIn, (req, res)=>{
  res.render("profileupload");
});

app.post("/upload", isLoggedIn, upload.single("image"), async (req, res)=>{
  let user = await userModel.findOne({email: req.user.email});
  user.profilepic = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

app.get("/login", (req, res)=>{
  res.render("login");
});

app.get("/logout", (req, res)=>{
  res.cookie("token", "");
  res.redirect("/login");
});


app.post('/register', async (req, res)=>{
  let {username, name, age, email, password} = req.body;
  let user = await userModel.findOne({email});
  if(user) return res.status(409).send("user already registered");   //Returns 409 when the user already exists.
  
  const hash = await bcrypt.hash(password, 10);
  const createdUser = await userModel.create({
    username,
    name,
    email,
    age,
    password: hash
  });
  
  const token = jwt.sign({email: email, userid: createdUser._id}, "secretKey");
  res.cookie("token", token);
  console.log(token);
  return res.redirect("/profile");

});

app.post('/login', async (req, res)=>{
  let {email, password} = req.body;
  let user = await userModel.findOne({email});
  if(!user) return res.status(401).send("Invalid Credentails");
 
  if(await bcrypt.compare(password, user.password)){
    const token = jwt.sign({email: email, userid: user._id}, "secretKey");
    res.cookie("token", token);
    res.status(200).redirect("/profile")
  } else res.status(401).send("Invalid Credentails");
});

app.get("/profile", isLoggedIn, async (req, res)=>{
  let user = await userModel.findOne({email: req.user.email}).populate("posts");
  res.render("profile", {user});
})

// middleware for protected routes
function isLoggedIn(req, res , next){
  if(req.cookies.token === "") res.redirect("/login");
  else{
    try{
      let data = jwt.verify(req.cookies.token, "secretKey");
      req.user = data;
      next(); 
    }catch(err){
      res.redirect("/login");
    }
  }
}


app.post('/post', isLoggedIn, async (req, res)=>{
  let user = await userModel.findOne({email: req.user.email});
  let {content} = req.body;
  const post = await postModel.create({
    user: user._id,
    content
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
})

app.get("/edit/:id", isLoggedIn, async (req, res)=>{
  let post = await postModel.findById(req.params.id);
  res.render("edit", {post});
});

app.post('/update/:id', isLoggedIn, async (req, res)=>{
  await postModel.findByIdAndUpdate(req.params.id, req.body );
  res.redirect("/profile");
});

app.get("/like/:id", isLoggedIn, async (req, res)=>{
    let post = await postModel.findOne({_id:req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid) === -1){
      post.likes.push(req.user.userid);
    }else{
      post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect("/profile");
})

app.listen(3000);