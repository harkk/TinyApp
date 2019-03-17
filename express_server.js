const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");

// before all routes because?
app.use(bodyParser.urlencoded({extended: true}));

// set up for cookieParser
app.use(cookieParser());

// this tells express to use EJS as templating engine, needs app
// declaration above
app.set("view engine", "ejs");


const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aj48lW" },
  "9sm5xK": { longURL:"http://www.google.com", userID: "aJ49jW" }
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
  },

  "test": {
    id: "test",
    email: "test@test.com",
    password: "test"
  }
}

function emailCheck(email){
  for(let id in users){
    let user = users[id];
    if (user.email === email) {
      return user;
    }
  }
}

function urlsForUser(id) {
filteredURLS = {};
  for (shortURL in urlDatabase) {
    // console.log("line 55");
    // console.log(id);
    // console.log(urlDatabase[shortURL].userID);
    if (urlDatabase[shortURL].userID === id) {
      filteredURLS[shortURL] = urlDatabase[shortURL];
    };
  };
   return filteredURLS;
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
    user: users[req.cookies.user_ID],
    urls: urlsForUser(req.cookies["user_ID"]),
  };
  res.render("urls_index", templateVars);
});

//route for login form
app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_ID]};
  res.render("urls_login", templateVars);

});

// add a new route for /urls/new
app.get("/urls/new", (req, res) => {
  user = users[req.cookies.user_ID]
  let templateVars = { user: user };
  if(users[req.cookies.user_ID]){
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// add second route and template
app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies.user_ID]
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
  urlDatabase[randomStr] = { longURL: req.body.longURL, user_ID: users[req.cookies.user_ID] };
  res.redirect(`/urls/${randomStr}`)
  //console.log(urlDatabase);
  //console.log(urlDatabase); returns urlDatabase with added url
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.cookies.user_ID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.post("/urls/:id", (req, res) => {
  let user_ID = req.cookies.user_ID
  if (!user_ID) {
    res.redirect("/login/");
  }
  else {
    var userURLs = urlsForUser(user_ID);
    if (userURLs[req.params.shortURL]) {
      urlDatabase[req.params.id].longURL = req.body.longURL;
    }
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  let email = req.body.email;
  let userEmail = emailCheck(email);
  let userPass = userEmail.password;
  let userPasswordDB = req.body.password;
  let hashVsPass = bcrypt.compareSync(userPasswordDB, userPass)

  if (!userEmail) {
    res.status(403).send("Email not found in database.");
  } else if (hashVsPass === false){
    res.status(403).send("Invalid password.");
  } else {
    res.cookie("user_ID", userEmail.id);
    res.redirect("/urls");
  }
  // console.log(userEmail);
  // console.log(bcrypt.compareSync(userPasswordDB, userPass));
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_ID");
  res.redirect("urls");
});

// getting the register info
app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_ID]}
  res.render('urls_register', templateVars);
});

// post register info
app.post("/register", (req, res) => {
  const user_ID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password || emailCheck(email)) {
    res.status(400).send("Invalid email or password.")
  } else {
    users[user_ID] = {
      id: user_ID,
      email: req.body.email,
      password: hashedPassword
    };
    res.cookie("user_ID", user_ID);
    res.redirect("/urls");
  }
  //console.log(users)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// add generateRandomString() function
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

