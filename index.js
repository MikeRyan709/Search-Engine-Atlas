const express = require("express");
const session = require("express-session");
//const path = require("path");
const pg = require("pg");
const bcrypt = require("bcrypt");
const nunjucks = require("nunjucks");
const mongodb = require("mongodb");

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "Locations",
  password: "password",
  port: 5432,
});

const URI = "mongodb://localhost";
const client = new mongodb.MongoClient(URI);

const app = express();

nunjucks.configure("views", {
  express: app,
  noCache: false,
});

app.use(express.static(__dirname + "/public"));
app.use(session({ secret: "test", resave: true, saveUninitialized: true }));

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("homepage.html");
});

app.get("/signup", function (req, res) {
  res.render("signup.html");
});


app.get("/search", function (req, res) {
  res.render("search.html");
});

app.get("/results.html", function (req, res) {
  res.render("results.html");
});

app.post("/signup", async function (req, res) {
  let email = req.body.email;
  let password = req.body.password;
  let encrypt_pass = await bcrypt.hash(password, 6);
  let results = await pool.query("SELECT * FROM users where email=$1", [email]);
  if (results.rows.length > 0) {
    res.send("Uh oh, there is already an account with this email");
  } else {
    let insert_results = await pool.query(
      "INSERT INTO users(email, password) VALUES ($1, $2)",
      [email, encrypt_pass]
    );
    //res.send("Account has been created!");
    res.redirect("/login");
  }
});

app.get("/login", function (req, res) {
  res.render("login.html");
});

app.post("/login", async function (req, res) {
  const email = req.body.email;

  const password = req.body.password;
  let results = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
  if (results.rows < 1) {
    res.send("Error, account not found!");
  } else if (results.rows > 1) {
    console.warn("Two accounts have this email!");
    res.send("Multiple accounts have this email!");
  } else {
    if (bcrypt.compare(password, results.rows[0].password)) {
      req.session.loggedin = true;
      res.redirect("/search");
      console.log("logged in");
    } else {
      res.send("Invalid credentials try again!");
    }
  }
});

app.post("/search", async function (req, res) {
  if (req.session.loggedin === true){
    console.log("Access granted!");
  }else {
    res.redirect("/login")
    return;
  }
  await client.connect();
  const search = req.body.search;
  const select = req.body.select;
  if (select === "postgres"){
  let search_results = await pool.query(
    "SELECT city, country, code, timezone FROM locations WHERE country LIKE '%" + search + "%'"
  );
  res.render("results.html", {
    results: search_results.rows //.rows.map((result) => JSON.stringify(result, null, 2)),
  });
} else {
  if (select === "mongo") {
  let search_results = await client.db("locations").collection("location_data").find({"country": search}).toArray();
  res.render("results.html", {
    results: search_results
  });
}};
})

app.post("/logout", function (req, res) {
  if (req.session.destroy()) {
    console.log("Logged out!")
  }});


app.listen(3000, function () {
  console.log("listening at http://localhost:3000");
});
