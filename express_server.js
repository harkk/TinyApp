const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

// set up for bodyParser
app.use(bodyParser.urlencoded({extended: true}));

// set up for cookieSession
app.use(cookieSession({
  name: 'session',
  keys: ['secrets'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// EJS is set as view engine
app.set("view engine", "ejs");

// Databases
const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aj48lW" },
  "9sm5xK": { longURL:"http://www.google.com", userID: "aJ49jW" }
}

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

// Functions
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
    if (urlDatabase[shortURL].userID === id) {
      filteredURLS[shortURL] = urlDatabase[shortURL];
    };
  };
   return filteredURLS;
}

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}


// Routes
app.get("/", (req, res) => {
  res.send("Hello!");
})

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
})

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
})

app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_ID],
    urls: urlsForUser(req.session.user_ID),
  };
  res.render("urls_index", templateVars);
})

app.get("/login", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_ID]};
  res.render("urls_login", templateVars);

})

app.get("/urls/new", (req, res) => {
  user = users[req.session.user_ID]
  let templateVars = { user: user };
  if(users[req.session.user_ID]){
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
})

app.get("/urls/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  let templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.session.user_ID]
  };
  res.render("urls_show", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.post("/urls", (req, res) => {
  const randomStr = generateRandomString();
  if (req.body.longURL) {
    urlDatabase[randomStr] = {longURL: "", userID: ""};
    urlDatabase[randomStr].longURL = req.body.longURL;
    urlDatabase[randomStr].userID = req.session.user_ID;
    res.redirect(`/urls/${randomStr}`);
  } else {
    res.redirect("/urls/new")
  }
})

app.post("/urls/:shortURL/delete", (req, res) => {
  let shortURL = req.params.shortURL;
  if (req.session.user_ID) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
})

app.post("/urls/:id", (req, res) => {
  let user_ID = req.session.user_ID
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
})

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
    req.session.user_ID = userEmail.id;
    res.redirect("/urls");
  }
})

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("urls");
})

app.get("/register", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.session.user_ID]}
  res.render('urls_register', templateVars);
})

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
    req.session.user_ID = user_ID;
    res.redirect("/urls");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
})
