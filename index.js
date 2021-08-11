const express = require('express')
const session = require('express-session')
const path = require('path')
const pg = require('pg')
const bcrypt = require('bcrypt')

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database:'Locations',
    password:'password',
    port:5432
})

const app = express();

app.use(express.static(__dirname + '/public'));
app.use(session({secret:"test", resave: true, saveUninitialized: true}))


app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));


app.get("/", function(req, res){
    res.sendFile(path.join(__dirname, 'homepage.html'))
})

app.get('/signup', function(req, res){
    res.sendFile(path.join(__dirname, 'signup.html'))
})

app.get('/logout', function(req, res){
    res.sendFile(path.join(__dirname, 'logout.html'))
})

app.get('/search', function(req, res){
    res.sendFile(path.join(__dirname, 'search.html'))
})


app.post('/signup', async function(req, res){
    let email = req.body.email;
    let password = req.body.password;
    let encrypt_pass = await bcrypt.hash(password, 6);
    let results = await pool.query('SELECT * FROM users where email=$1', [email])
    if (results.rows.length > 0){
        res.send("Uh oh, there is already an account with this email")
    }else{
        let insert_results = await pool.query('INSERT INTO users(email, password) VALUES ($1, $2)', [email, encrypt_pass])
        res.send("Account has been created!")
    }
})



app.get("/login", function(req, res){
    res.sendFile(path.join(__dirname, 'login.html'))
})

app.post("/login", async function(req, res){
    const email = req.body.email;

    const password = req.body.password;
    let results = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if(results.rows < 1){
        res.send("Error, account not found!")
    }else if(results.rows > 1){
        console.warn("Two accounts have this email!")
        res.send("Multiple accounts have this email!")
    }else{
        if(bcrypt.compare(password, results.rows[0].password)){
            req.session.loggedin = true;
        }else{
            res.send("Invalid credentials try again!")
        }

    }
})
    

app.get("/secret", function(req,res){
    if(req.session.loggedin === true){
        res.send("You can see this because you're logged in!")
    }else{
        res.send("Please login to view")
    }
})


app.post("/logout", function(req,res){
    if(req.session.destroy()){
        res.send("You have logged out!")
    }
})




app.listen(3000, function(){
    console.log("listening at http://localhost:3000")
})