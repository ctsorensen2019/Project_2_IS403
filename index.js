const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const port = process.env.PORT || 3500;

// Configure knex to connect to the assignment3 database
const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "localhost",
        user: process.env.RDS_USERNAME || "postgres",
        password: process.env.RDS_PASSWORD || "Christian0427", 
        database: process.env.RDS_DB_NAME || "project 2",
        port: process.env.RDS_PORT|| 5432, 
        // Uncomment the below code when connecting to RDS
        ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
        //ssl: { rejectUnauthorized: false }
    }
  });



// Middleware to parse URL-encoded bodies
//app.use(express.urlencoded({ extended: true }));



// Root route to display all data
app.get('/', (req, res) => {
    res.render('index');
  });


// Route to display a specific Pokémon based on ID
//app.get("/searchAthlete", (req, res) => {
//    //NOTICE query since I am retrieving data from a form using the get method
//    knex.select().from('athlete').where('athlastname', req.query.searchName.toUpperCase() ).first().then( athls => {
//        res.render("displayAthlete", { athlete: athls });
//    }).catch(err => {
//        console.log(err);
//        res.status(500).json({err});
//    });
//})

app.get('/login', (req, res) => {
    res.render('login', { errorMessage: null });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Validate credentials (replace with your logic)
    if (username === 'user' && password === 'password') {
        res.send('Login successful');
    } else {
        res.render('login', { errorMessage: 'Invalid username or password' });
    }
});

// Start the server
app.listen(port, () => console.log("Athlete Express App has started and server is listening on port 3500!"));
