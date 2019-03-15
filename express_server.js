const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

// before all routes because?
app.use(bodyParser.urlencoded({extended: true}));

// set up for cookieParser
app.use(cookieParser());

// this tells express to use EJS as templating engine, needs app
// declaration above
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {

  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },

 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function emailCheck(input){
  for(id in users){
  if(users[id]['email'] === input){
    return true;
    }
  } return false;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});


// added below code as route if we go to http://localhost:8080/
// urls.json it will resolve and give us the urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// response now resolves this HTML when we go to
// http://localhost:8080/hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// add route for /urls
app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase };
  res.render('urls_index', templateVars);
});

// add a new route for /urls/new
app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars)
})

// add second route and template
app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

// this will take any request to /u/:shortURL and redirect to longURL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// add post route to receive form submission
app.post("/urls", (req, res) => {
  // console.log(req.body.longURL);  // Log the POST request body to the console
  const randomStr = generateRandomString();
  //console.log(req.body.longURL) ---> the url we entered
  urlDatabase[randomStr] = req.body.longURL;
  res.redirect(`/urls/${randomStr}`)
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  //console.log("test", shortURL);
  res.redirect("/urls");
});

app.post("/urls/:shortURL/update", (req, res) => {
 //console.log(req.body.longURL);
 let shortURL = req.params.shortURL;
 urlDatabase[shortURL] = req.body.longURL;
 res.redirect(`/urls/${shortURL}`);
})

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("urls");
});

// getting the register info
app.get("/register", (req, res) => {
  let templateVars = {user: users[req.cookies.user_id]}
  res.render('urls_register', templateVars);
});

// post register info
app.post("/register", (req, res) => {
  let id = generateRandomString();
  let email = req.body.email;
  let password = req.body.password;
  if(emailCheck(email)){
    res.status(400);
    res.send('Error: The email address is already in use.');
  } else if (email.length === 0 || password.length === 0) {
    res.status(400).send("Invalid email or password");
  } else {
  //add user
    users[id] = {
    id: id,
    email: email,
    password: password
  }
  res.cookie("user_id", id);
  console.log(users);
  res.redirect("/urls");
}
})


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// add generateRandomString() function
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}