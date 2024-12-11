const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Set up the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());

const port = process.env.PORT || 3500;

// Configure knex to connect to the assignment3 database
const knex = require("knex")({
    client: "pg",
    connection: {
        host: process.env.RDS_HOSTNAME || "awseb-e-hepbe4apek-stack-awsebrdsdatabase-7ahil2gnwyg7.czigc2goqitw.us-east-1.rds.amazonaws.com",
        user: process.env.RDS_USERNAME || "ebroot",
        password: process.env.RDS_PASSWORD || "group1-4",
        database: process.env.RDS_DB_NAME || "ebdb",
        port: process.env.RDS_PORT || 5432,
        // Uncomment the below code when connecting to RDS
        // ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
        ssl: { rejectUnauthorized: false }
    }
});



// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));



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
    knex('athlete')
        .select('athleteid', 'athfirstname', 'athlastname', 'schoolid', 'employeeid', 'phonenumber', 'email')
        .then((results) => {
            res.render('showAthlete', { athletes: results, errorMessage: null }); // Pass as "athletes"
        })
        .catch((error) => {
            console.error('Error fetching athletes:', error);
            res.render('showAthlete', { athletes: [], errorMessage: 'Error fetching athlete data.' });
        });
});




// search athlete
app.get('/searchAthlete', (req, res) => {
    const { first_name, last_name, sport } = req.query; // Fetch data from query parameters

    knex('athlete')
        .modify((queryBuilder) => {
            if (first_name) {
                queryBuilder.where('first_name', 'like', `%${first_name}%`);
            }
            if (last_name) {
                queryBuilder.where('last_name', 'like', `%${last_name}%`);
            }
            if (sport) {
                queryBuilder.where('sport', 'like', `%${sport}%`);
            }
        })
        .select('*') // Adjust fields if necessary
        .then((athlete) => {
            res.render('showAthlete', { athlete, errorMessage: null });
        })
        .catch((error) => {
            console.error('Error fetching athletes:', error);
            res.render('showAthlete', { athlete: [], errorMessage: 'Error fetching athlete data.' });
        });
});


//Add//
//Athlete//


//Gets the required info to be able to add Users
    app.get('/addAthlete', (req, res) => {
        Promise.all([
            knex('school').select('schoolid', 'schooldescription'),
            knex('employees').select('employeeid', 'empfirstname', 'emplastname')
        ])
            .then(([schools, employees]) => {
                res.render('addAthlete', { schools, employees });
            })
            .catch(error => {
                console.error('Error fetching data for addAthlete:', error);
                res.status(500).send('Internal Server Error');
            });
    });

 // fetches the add user page


//Shows the changes on the client side
    app.post('/addAthlete', (req, res) => {
        const { athfirstname, athlastname, email, phonenumber, schoolid, employeeid } = req.body;

        // Validate foreign keys
        Promise.all([
            knex('school').where({ schoolid }).first(),
            knex('employees').where({ employeeid }).first()
        ])
            .then(([school, employee]) => {
                if (!school || !employee) {
                    throw new Error('Invalid school ID or employee ID');
                }
                return knex('athlete').insert({
                    athfirstname: athfirstname.toUpperCase(),
                    athlastname: athlastname.toUpperCase(),
                    email: email.toUpperCase(),
                    phonenumber,
                    schoolid,
                    employeeid
                });
            })
            .then(() => res.redirect('/showAthlete'))
            .catch(error => {
                console.error('Error adding athlete:', error);
                res.status(500).send('Internal Server Error');
            });
    });




//Edit//
//User//


//configures the edit user functionality
app.get('/editAthlete/:id', (req, res) => {
    const athfirstname = req.body.athfirstname || ''; // Default to empty string if not provided
    const athlastname = req.body.athlastname || '';
    const sportdescription = req.body.sportdescription || '';
    const schooldescription = req.body.schooldescription || '';
    const statistic = parseFloat(req.body.statistic) || 0.0;
    const statisticdescription = req.body.statisticdescription || ''; // Default to empty string if not provided
    knex('athlete')
        .where('id', id)
        .first()
        .then(athlete => {
            if (!athlete) {
                console.error(`No Athlete found with id: ${id}`);
                return res.status(404).send('Athlete not found');
            }
            res.render('editAthlete', { athlete, security });
        })
        .catch(error => {
            console.error('Error fetching Athletes for editing:', error);
            res.status(500).send('Internal Server Error');
        });
});



//further configures the edit user, and allows for edits
app.post('/editAthlete/:id', (req, res) => {
    const athfirstname = req.body.athfirstname || ''; // Default to empty string if not provided
    const athlastname = req.body.athlastname || '';
    const sportdescription = req.body.sportdescription || '';
    const schooldescription = req.body.schooldescription || '';
    const statistic = parseFloat(req.body.statistic) || 0.0;
    const statisticdescription = req.body.statisticdescription || ''; // Default to empty string if not provided
    // Update only the accesscontrol field for the given username
    knex('athlete')
        .where('id', id) // Ensure you are updating the correct user
        .update({
            athfirstname: athfirstname.toUpperCase(),
            athlastname: athlastname.toUpperCase(),
            sportdescription: sportdescription.toUpperCase(),
            schooldescription: schooldescription.toUpperCase(),
            statistic: statistic,
            statisticdescription: statisticdescription.toUpperCase()
        })
        .then(() => {
            res.redirect('/showAthlete'); // Redirect after successful update
        })
        .catch(error => {
            console.error('Error updating Athlete:', error);
            res.status(500).send('Internal Server Error');
        });
});


//Remove//
//User//


//Allows for deletion
app.post('/deleteAthlete/:id', (req, res) => {
    const athleteid = req.params.id;
    knex('athlete')
        .where('id', id)
        .del() // Deletes the record with the specified username
        .then(() => {
            res.redirect('/showAthlete'); // Redirect to the user list after deletion
        })
        .catch(error => {
            console.error('Error deleting Athlete:', error);
            res.status(500).send('Internal Server Error');
        });
});


//// Schools

// school get route
app.get('/schools', (req, res) => {
    // Fetch athlete data from the database
    knex('School')
        .select('*') // Adjust fields if needed
        .then((results) => {
            // Pass the results directly as `athlete`
            res.render('schools', { school: results, errorMessage: null });
        })
        .catch((error) => {
            console.error('Error fetching schools:', error);
            // Pass an empty array for `athlete` and include an error message
            res.render('schools', { school: [], errorMessage: 'Error fetching school data.' });
        });
});

// edit school
app.get('/editSchool/:SchoolID', async (req, res) => {
    const id = req.params.SchoolID;
    const school = await knex('School').where({SchoolID : id}).first()

    res.render('/editSchool' , {school})
});

app.post('/editSchool', (req, res) => {
    const {
        schoolid,
        schooldescription,
    } = req.body;

    // Build an object with the fields to update
    const updateData = {
        SchoolDescription: schooldescription,

    };

    // Update the employee data in the database
    knex('School')
        .where('SchoolID', schoolid)
        .update(updateData)
        .then(() => {
            // Redirect to a page showing the updated employee details or a confirmation page
            res.redirect('/schools'); // Redirecting to a view where the employee info is shown
        })
        .catch(error => {
            console.error('Error updating employee:', error);
            res.render('editEmployee', { 
                errorMessage: 'There was an error updating the employee data.' 
            });
        });
});





// delete school
app.post('/deleteSchool/:SchoolID', (req, res) => {
    const id = req.params.SchoolID;
    knex('School')
        .where('SchoolID', id)
        .del() // Deletes the record with the specified username
        .then(() => {
            res.redirect('/schools'); // Redirect to the user list after deletion
        })
        .catch(error => {
            console.error('Error deleting school:', error);
            res.status(500).send('Internal Server Error');
        });
});

// add school
app.get('/addSchool', (req, res) => {
    res.render('addSchool')
});

app.post('/addSchool', (req, res) => {
    const schoolname = req.body.schooldescription
    knex('School').insert({SchoolDescription : schoolname})
    res.redirect('/schools')
})



/// employees
// get route
app.get('/employees', (req, res) => {
    // Fetch athlete data from the database
    knex('Employees')
        .select('*') // Adjust fields if needed
        .then((results) => {
            // Pass the results directly as `athlete`
            res.render('employees', { employee: results, errorMessage: null });
        })
        .catch((error) => {
            console.error('Error fetching employee:', error);
            // Pass an empty array for `athlete` and include an error message
            res.render('employees', { employee: [], errorMessage: 'Error fetching employee data.' });
        });
});

// edit employee get
app.get('/editEmployee/:EmployeeID', (req, res) => {
    const { employeeid } = req.params;

    // Fetch the employee data from the database
    knex('Employees')
        .where('EmployeeID', employeeid)
        .first() // We use first() to get a single result
        .then(employee => {
            if (employee) {
                // Render the edit form with the employee data
                res.render('editEmployee', { employee });
            } else {
                // If the employee is not found, show an error message
                res.status(404).render('error', { message: 'Employee not found' });
            }
        })
        .catch(error => {
            console.error('Error fetching employee data:', error);
            res.status(500).render('error', { message: 'Error fetching employee data' });
        });
});


// edit employee post
app.post('/editEmployee', (req, res) => {
    const {
        employeeid,
        empfirstname,
        emplastname,
        address,
        city,
        state,
        zip,
        username,
        password
    } = req.body;

    // Build an object with the fields to update
    const updateData = {
        EmpFirstName: empfirstname,
        EmpLastName: emplastname,
        Address: address,
        City: city,
        State: state,
        Zip: zip,
        Username: username
    };

    // Include the password if provided (not blank)
    if (password) {
        updateData.Password = password;  // Assuming password is hashed before saving in production
    }

    // Update the employee data in the database
    knex('Employees')
        .where('EmployeeID', employeeid)
        .update(updateData)
        .then(() => {
            // Redirect to a page showing the updated employee details or a confirmation page
            res.redirect('/employees'); // Redirecting to a view where the employee info is shown
        })
        .catch(error => {
            console.error('Error updating employee:', error);
            res.render('editEmployee', { 
                errorMessage: 'There was an error updating the employee data.' 
            });
        });
});







// delete employee
app.post('/deleteEmployee/:EmployeeID', (req, res) => {
    const id = req.params.EmployeeID;
    knex('Employees')
        .where('id', id)
        .del() // Deletes the record with the specified username
        .then(() => {
            res.redirect('/employees'); // Redirect to the user list after deletion
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
            res.status(500).send('Internal Server Error');
        });
});

// add employee
app.get('/addEmployee', (req, res) => {
    res.render('addEmployee')
});

app.post('/addEmployee', (req, res) => {
    const { empfirstname, emplastname, address, city, state, zip, username, password } = req.body;
  
    knex('Employees')
      .insert({
        EmpFirstName: empfirstname,
        EmpLastName: emplastname,
        Address: address,
        City: city,
        State: state,
        Zip: zip,
        Username: username,
        Password: password
      })
      .then(() => {
        res.redirect('/showEmployees'); // Redirect to the employees list after adding
      })
      .catch(error => {
        console.error('Error adding employee:', error);
        res.status(500).send('Error adding employee.');
      });
  });
  







// Start the server
app.listen(port, () => console.log("Athlete Express App has started and server is listening on port 3500!"));
