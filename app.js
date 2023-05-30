const express = require('express');
const app = express();
module.exports = app;
const mysql = require("mysql")
const path = require("path")
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

dotenv.config({ path: './.env' })

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
})

const publicDir = path.join(__dirname, './public')

app.use(express.static(publicDir))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.set('view engine', 'hbs')

db.connect((error) => {
    if (error) {
        console.log(error)
    } else {
        console.log("MySQL connected!")
    }
})

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/register", (req, res) => {
    res.render("register")
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.post("/auth/register", (req, res) => {
    const { name, email, password, password_confirm } = req.body
    
    db.query('SELECT email FROM user WHERE email = ?', [email], async (error, result) => {
        if(error){
            console.log(error)
        }
        
    if (!name || !email || !password) {
        return res.render('register', {
            message: 'Please enter all required fields!'
        })
    }
    
    if (!email.match(/^\S+@\S+\.\S+$/)) {
        return res.render('register', {
            message: 'Email address is not valid. Please enter a valid email address.'
        })
    }
    
    if (!password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)) {
        return res.render('register', {
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
        })
    }
    if (password !== password_confirm) {
        return res.render('register', {
            message: "Password Didn't Match!"
        })
    }
    if (result.length > 0) {
        return res.render('register', {
            message: 'This email is already in use'
        })
    }
   
   
        let hashedPassword = await bcrypt.hash(password, 8)
    
        db.query('INSERT INTO user SET ?', { username: name, email: email, password: hashedPassword },(err, result) => {
            if (error) {
                console.log(error)
            } 
          
            else {
                return res.render('register', {
                    message: 'User registered!'
                })
            }
           
        })
      
    })
})


    app.post("/login", async (req, res) => {
        const { email, password } = req.body;
  // Validate input
 // Validate input
if (!email || !password) {
    return res.status(400).send("Please provide an email and password");
}

try {
    const rows = await promisify(db.query).call(db, 'SELECT * FROM user WHERE email = ?', [email]);

    // Check if user exists
    if (rows.length === 0) {
        return res.status(401).send("Invalid email or password");
    }

    // Check if password is correct
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        return res.status(401).send("Invalid email or password");
    }

    // Login successful
    //req.session.userId = user.id; // Store user ID in session
    res.redirect("/welcome");
} catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
}
    })
app.get("/welcome", function (req, res) {
    res.sendFile(__dirname + "/welcome.html")
    
    })
app.listen(5000, ()=> {
        console.log("server started on port 5000")
    })