let express = require('express');
let app = express();
let path = require('path');

const port = 3500;

// Configure knex to connect to the assignment3 database
const knex = require("knex")({
    client: "pg",
    connection: {
        host: "localhost",
        user: "postgres",
        password: "Christian0427",
        database: "project 2",
        port: 5432
    }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Root route to display all Pokémon data
app.get("/", async (req, res) => {
        knex.select().from('athlete').orderBy('athlastname').then( athls => {
            res.render("index", { athlete: athls });
        }).catch(err => {
            console.log(err);
            res.status(500).json({err});
        });
    });

// Route to display a specific Pokémon based on ID
app.get("/searchAthlete", (req, res) => {
    //NOTICE query since I am retrieving data from a form using the get method
    knex.select().from('athlete').where('athlastname', req.query.searchName.toUpperCase() ).first().then( athls => {
        res.render("displayAthlete", { athlete: athls });
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
})

// Start the server
app.listen(port, () => console.log("Athlete Express App has started and server is listening on port 3500!"));
