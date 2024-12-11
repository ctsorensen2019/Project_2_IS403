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


///////
///////
//BACKEND
///////
///////

//////Athlete//////

app.get('/showAthlete', (req, res) => {
    // Fetch athlete data from the database
    knex('athlete') // Replace 'administration' with the correct table name for athletes
        .select('*') // Adjust fields if needed
        .then(athlete => {
            res.render('showAthlete', { athlete, errorMessage: null });
        })
        .catch(error => {
            console.error('Error fetching athletes:', error);
            res.render('showAthlete', { athletes: [], errorMessage: 'Error fetching athlete data.' });
        });
});

// search athlete
app.get('/searchAthlete/:athlete_id', (req, res) => {
    // Fetch athlete data from the database
    const athleteid = req.params.athlete_id
    knex('athlete')
        .where({athleteid : athlete_id}) // Replace 'administration' with the correct table name for athletes
        .select('*') // Adjust fields if needed
        .then(athlete => {
            res.render('showAthlete', { athlete, errorMessage: null });
        })
        .catch(error => {
            console.error('Error fetching athletes:', error);
            res.render('showAthlete', { athletes: [], errorMessage: 'Error fetching athlete data.' });
        });
});

//Add//
//Athlete//


//Gets the required info to be able to add Users
app.get('/addAthlete', (req, res) => {
    res.render('addAthlete', {security})
}); // fetches the add user page


//Shows the changes on the client side
app.post('/addAthlete', (req, res) => {
// Extract form values from req.body
    const athfirstname = req.body.athfirstname || ''; // Default to empty string if not provided
    const athlastname = req.body.athlastname || '';
    const sportdescription = req.body.sportdescription || '';
    const schooldescription = req.body.schooldescription || '';
    const statistic = parseFloat(req.body.statistic) || 0.0;
    const statisticdescription = req.body.statisticdescription || ''; // Default to empty string if not provided
// Insert the new Characters into the database
knex('athlete')
  .insert({
    athfirstname: athfirstname.toUpperCase(), 
    athlastname: athlastname.toUpperCase(),
    sportdescription: sportdescription.toUpperCase(),
    schooldescription: schooldescription.toUpperCase(),
    statistic: statistic,
    statisticdescription: statisticdescription.toUpperCase()
  })
  .then(() => {
    res.redirect('/showAthlete'); // Redirect to the user list page after adding
  })
  .catch(error => {
    console.error('Error adding Athlete:', error);
    res.status(500).send('Internal Server Error');
  });
});


//Edit//
//User//


//configures the edit user functionality
app.get('/editUser/:username', (req, res) => {
const username = req.params.username;


if (!username) {
    console.error('Username parameter is missing');
    return res.status(400).send('Username is required');
}

knex('administration')
    .where('username', username)
    .first()
    .then(administration => {
        if (!administration) {
            console.error(`No user found with username: ${username}`);
            return res.status(404).send('User not found');
        }
        res.render('editUser', { administration, security });
    })
    .catch(error => {
        console.error('Error fetching Users for editing:', error);
        res.status(500).send('Internal Server Error');
    });
});



//further configures the edit user, and allows for edits
app.post('/editUser/:username', (req, res) => {
const username = req.params.username; // Get the current username from the URL
const newAccessControl = req.body.accesscontrol; // Get the updated accesscontrol value from the form

if (!username || !newAccessControl) {
    console.error('Missing username or accesscontrol in request');
    return res.status(400).send('Username and Access Control are required');
}

// Update only the accesscontrol field for the given username
knex('administration')
    .where('username', username) // Ensure you are updating the correct user
    .update({
        accesscontrol: newAccessControl, // Update accesscontrol field
    })
    .then(() => {
        res.redirect('/userMaint'); // Redirect after successful update
    })
    .catch(error => {
        console.error('Error updating User:', error);
        res.status(500).send('Internal Server Error');
    });
});


//Remove//
//User//


//Allows for deletion
app.post('/deleteUser/:username', (req, res) => {
const username = req.params.username;
knex('administration')
  .where('username', username)
  .del() // Deletes the record with the specified username
  .then(() => {
    res.redirect('/userMaint'); // Redirect to the user list after deletion
  })
  .catch(error => {
    console.error('Error deleting User:', error);
    res.status(500).send('Internal Server Error');
  });
});












// Start the server
app.listen(port, () => console.log("Athlete Express App has started and server is listening on port 3500!"));
