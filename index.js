const express = require('express');
const path = require('path');
const app = express();
let security = false;
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
    security = false;
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

    knex('employees')
        .where({ username: username, password: password })
        .first() // Use .first() to get a single result (or null if no match)
        .then((employee) => {
            // If no employee is found, the result will be null
            if (employee) {
                // Login successful
                security = true;
                res.redirect('showAthlete');
            } else {
                // Login failed (username or password incorrect)
                res.render('login', { errorMessage: 'Invalid username or password' });
            }
        })
        .catch((err) => {
            // Handle any errors during the query
            console.error('Error during login:', err);
            res.status(500).send('Internal server error');
        });
});



///////
///////
//BACKEND
///////
///////

//////Athlete//////

app.get('/showAthlete', (req, res) => {
    knex('athlete')
        .join('school', 'athlete.schoolid', '=', 'school.schoolid')  // Correct table name 'school'
        .join('employees', 'athlete.employeeid', '=', 'employees.employeeid')  // Join with employees table
        .select('athlete.athleteid', 'athlete.athfirstname', 'athlete.athlastname', 
                'athlete.phonenumber', 'athlete.email', 'school.schooldescription', 
                'employees.empfirstname', 'employees.emplastname') // Adjust fields as needed
        .then((results) => {
            res.render('showAthlete', { athletes: results, errorMessage: null });
        })
        .catch((error) => {
            console.error('Error fetching athletes:', error);
            res.render('showAthlete', { athletes: [], errorMessage: 'Error fetching athlete data.' });
        });
});






// search athlete
app.get('/searchAthlete', (req, res) => {
    const { first_name, last_name } = req.query; // Fetch data from query parameters

    // Convert to uppercase if the values exist
    const firstNameUpper = first_name ? first_name.toUpperCase() : '';
    const lastNameUpper = last_name ? last_name.toUpperCase() : '';

    knex('athlete')
        .join('school', 'athlete.schoolid', '=', 'school.schoolid')  // Inner join with schools table
        .join('employees', 'athlete.employeeid', '=', 'employees.employeeid')  // Inner join with employees table
        .modify((queryBuilder) => {
            if (firstNameUpper) {
                queryBuilder.where('athfirstname', 'like', `%${firstNameUpper}%`);
            }
            if (lastNameUpper) {
                queryBuilder.where('athlastname', 'like', `%${lastNameUpper}%`);
            }
        })
        .select('athlete.*', 'schools.schooldescription', 'employees.empfirstname', 'employees.emplastname') // Adjust fields if necessary
        .then((athletes) => {
            res.render('searchAthlete', { athletes, first_name, last_name, security, errorMessage: null });
        })
        .catch((error) => {
            console.error('Error fetching athletes:', error);
            res.render('searchAthlete', { athletes: [], errorMessage: 'Error fetching athlete data.' });
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
    const {
        athfirstname,
        athlastname,
        email,
        phonenumber,
        schoolid,
        employeeid,
        blocks,
        steals,
        turnovers,
        twopointers,
        threepointers,
        tackles,
        catches,
        sacks,
        interceptions,
        touchdowns
    } = req.body;

    // Set default values for missing stats
    const stats = {
        blocks: blocks || 0,
        steals: steals || 0,
        turnovers: turnovers || 0,
        twopointers: twopointers || 0,
        threepointers: threepointers || 0,
        tackles: tackles || 0,
        catches: catches || 0,
        sacks: sacks || 0,
        interceptions: interceptions || 0,
        touchdowns: touchdowns || 0
    };

    // Validate schoolid and employeeid, then get statistics descriptions
    knex.transaction(async (trx) => {
        try {
            // Step 1: Validate foreign keys and fetch statistics descriptions in a single transaction
            const [school, employee, statsDescriptions] = await Promise.all([
                trx('school').where({ schoolid }).first(),
                trx('employees').where({ employeeid }).first(),
                trx('statistics').whereIn('statisticdescription', [
                    'blocks', 'steals', 'turnovers', '2-pointers', '3-pointers',
                    'tackles', 'catches', 'sacks', 'interceptions', 'touchdowns'
                ])
            ]);

            if (!school || !employee) {
                throw new Error('Invalid school ID or employee ID');
            }

            if (statsDescriptions.length !== 10) {
                throw new Error('Missing statistics descriptions');
            }

            // Step 2: Insert athlete into 'athlete' table
            const [athlete] = await trx('athlete').insert({
                athfirstname: athfirstname.toUpperCase(),
                athlastname: athlastname.toUpperCase(),
                email: email.toUpperCase(),
                phonenumber,
                schoolid,
                employeeid
            }).returning('athleteid'); // Get athleteid for the inserted athlete

            const athleteid = athlete.athleteid;

            // Step 3: Insert athlete stats into 'athletestatistics' table with hardcoded sportid

            const athleteStats = [
                // Basketball stats (sportid = 1)
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'blocks').statisticid, statistic: stats.blocks, sportid: 1 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'steals').statisticid, statistic: stats.steals, sportid: 1 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'turnovers').statisticid, statistic: stats.turnovers, sportid: 1 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === '2-pointers').statisticid, statistic: stats.twopointers, sportid: 1 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === '3-pointers').statisticid, statistic: stats.threepointers, sportid: 1 },

                // Football stats (sportid = 4)
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'tackles').statisticid, statistic: stats.tackles, sportid: 4 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'catches').statisticid, statistic: stats.catches, sportid: 4 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'sacks').statisticid, statistic: stats.sacks, sportid: 4 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'interceptions').statisticid, statistic: stats.interceptions, sportid: 4 },
                { athleteid, statisticid: statsDescriptions.find(s => s.statisticdescription === 'touchdowns').statisticid, statistic: stats.touchdowns, sportid: 4 }
            ];

            // Step 4: Insert stats into 'athletestatistics'
            await trx('athletestatistics').insert(athleteStats);

            // Step 5: Commit the transaction and redirect
            await trx.commit();
            res.redirect('/showAthlete');
        } catch (error) {
            // Rollback in case of error
            await trx.rollback();
            console.error('Error adding athlete:', error);
            res.status(500).send('Internal Server Error');
        }
    });
});









//Edit//
//User//


//configures the edit user functionality
app.get('/editAthlete/:athleteid', (req, res) => {
    const athfirstname = req.body.athfirstname || ''; // Default to empty string if not provided
    const athlastname = req.body.athlastname || '';
    const sportdescription = req.body.sportdescription || '';
    const schooldescription = req.body.schooldescription || '';
    const statistic = parseFloat(req.body.statistic) || 0.0;
    const statisticdescription = req.body.statisticdescription || ''; // Default to empty string if not provided
    knex('athlete')
        .where('athleteid', athleteid)
        .first()
        .then(athlete => {
            if (!athlete) {
                console.error(`No Athlete found with id: ${athleteid}`);
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
app.post('/editAthlete/:athleteid', (req, res) => {
    const athfirstname = req.body.athfirstname || ''; // Default to empty string if not provided
    const athlastname = req.body.athlastname || '';
    const sportdescription = req.body.sportdescription || '';
    const schooldescription = req.body.schooldescription || '';
    const statistic = parseFloat(req.body.statistic) || 0.0;
    const statisticdescription = req.body.statisticdescription || ''; // Default to empty string if not provided
    // Update only the accesscontrol field for the given username
    knex('athlete')
        .where('athleteid', athleteid) // Ensure you are updating the correct user
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
app.post('/deleteAthlete/:athleteid', (req, res) => {
    const athleteid = req.params.athleteid;

    // Delete references in dependent tables
    knex('athletestatistics')
        .where('athleteid', athleteid)
        .del()
        .then(() => {
            return knex('offers')
                .where('athleteid', athleteid)
                .del();
        })
        .then(() => {
            // Finally, delete the athlete
            return knex('athlete')
                .where('athleteid', athleteid)
                .del();
        })
        .then(() => {
            res.redirect('/showAthlete');
        })
        .catch(error => {
            console.error('Error deleting athlete:', error);
            res.status(500).send('Internal Server Error');
        });
});



//// Schools

// school get route
app.get('/schools', (req, res) => {
    // Fetch athlete data from the database
    knex('school')
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
app.get('/editSchool/:schoolid', async (req, res) => {
    const id = req.params.schoolid;
    const school = await knex('school').where({schoolid : id}).first()

    res.render('editSchool' , {school})
});

app.post('/editSchool', (req, res) => {
    const {
        schoolid,
        schooldescription,
    } = req.body;

    // Build an object with the fields to update
    const updateData = {
        schooldescription: schooldescription,

    };

    // Update the employee data in the database
    knex('school')
        .where('schoolid', schoolid)
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
app.post('/deleteSchool/:schoolid', (req, res) => {
    const id = req.params.schoolid;
    knex('school')
        .where('schoolid', id)
        .del() // Deletes the record with the specified username
        .then(() => {
            res.redirect('/schools'); // Redirect to the user list after deletion
        })
        .catch(error => {
            console.error('Error deleting school:', error);
            res.status(500).send('CANNOT DELETE SCHOOL IF STUDENT IS LISTED THERE');
        });
});

// add school
app.get('/addSchool', (req, res) => {
    res.render('addSchool')
});

app.post('/addSchool', async (req, res) => {
    const schoolname = req.body.schooldescription
   await knex('school').insert({schooldescription : schoolname})
    res.redirect('/schools')
})



/// employees
// get route
app.get('/employees', (req, res) => {
    // Fetch athlete data from the database
    knex('employees')
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
app.get('/editEmployee/:employeeid', (req, res) => {
    const { employeeid } = req.params;

    // Fetch the employee data from the database
    knex('employees')
        .where('employeeid', employeeid)
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
        empfirstname: empfirstname,
        emplastname: emplastname,
        address: address,
        city: city,
        state: state,
        zip: zip,
        username: username
    };

    // Include the password if provided (not blank)
    if (password) {
        updateData.password = password;  // Assuming password is hashed before saving in production
    }

    // Update the employee data in the database
    knex('employees')
        .where('employeeid', employeeid)
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
app.post('/deleteEmployee/:employeeid', (req, res) => {
    const id = req.params.employeeid;
    knex('employees')
        .where('employeeid', id)
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
  
    knex('employees')
      .insert({
        empfirstname: empfirstname,
        emplastname: emplastname,
        address: address,
        city: city,
        state: state,
        zip: zip,
        username: username,
        password: password
      })
      .then(() => {
        res.redirect('/employees'); // Redirect to the employees list after adding
      })
      .catch(error => {
        console.error('Error adding employee:', error);
        res.status(500).send('Error adding employee.');
      });
  });
  
// athlete stats get
app.get('/statsAthlete/:athleteid', async (req, res)=> {
    const id = req.params.athleteid

    const football = await knex('athletestatistics')
    .join('statistics', 'statistics.statisticid','=','athletestatistics.statisticid')
    .join('sport', 'sport.sportid','=','athletestatistics.sportid')
    .where({sportdescription : 'football', athleteid : id})
    .select('*')

    const footballheaders = football.length > 0 ? Object.keys(football[0]) : [];

    const basketball = await knex('athletestatistics')
    .join('statistics', 'statistics.statisticid','=','athletestatistics.statisticid')
    .join('sport', 'sport.sportid','=','athletestatistics.sportid')
    .where({sportdescription : 'basketball', athleteid : id})
    .select('*')

    const basketballheaders = basketball.length > 0 ? Object.keys(basketball[0]) : [];

    res.render('statsAthlete', {football, footballheaders, basketball, basketballheaders, security})

});

// edit basketball stats
// get
app.get('/basketballStats/:athleteid', async (req, res) => {
    const id = req.params.athleteid
    const stats = await knex('athletestatistics')
    .join('statistics', 'statistics.statisticid','=','athletestatistics.statisticid')
    .join('sport', 'sport.sportid','=','athletestatistics.sportid')
    .where({sportdescription : 'basketball', athleteid : id}).select('*')
    res.render('basketballStats', {security, stats})
});
// post
app.post('/basketballStats/:athleteid', async (req, res) => {
    const athleteid = req.params.athleteid;
    const statistics = req.body;  // Now, req.body will contain a flat structure with statistic_<statisticid>
  
    // Make sure there is at least one statistic to update
    if (!statistics || Object.keys(statistics).length === 0) {
      return res.status(400).send('No statistics provided.');
    }
  
    try {
      // Loop through all the statistic values in the request body
      const updatePromises = Object.keys(statistics).map((key) => {
        // Extract the statistic ID from the key
        const statisticid = key.replace('statistic_', '');  // Extract statisticid from "statistic_<id>"
  
        // Get the value for that statistic
        const statisticValue = statistics[key];
  
        // Update the statistic in the athletestatistics table
        return knex('athletestatistics')
          .where({ athleteid: athleteid, statisticid: statisticid })
          .update({ statistic: statisticValue });
      });
  
      // Wait for all updates to complete
      await Promise.all(updatePromises);
  
      // Redirect to the athlete's basketball stats page
      res.redirect(`/statsAthlete/${athleteid}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating basketball statistics.');
    }
  });


// edit football stats
// get 
app.get('/footballStats/:athleteid', async (req, res) => {
    const id = req.params.athleteid
    const stats = await knex('athletestatistics')
    .join('statistics', 'statistics.statisticid','=','athletestatistics.statisticid')
    .join('sport', 'sport.sportid','=','athletestatistics.sportid')
    .where({sportdescription : 'football', athleteid : id})
    res.render('footballStats', {security, stats})
});

//post
app.post('/footballStats/:athleteid', async (req, res) => {
    const athleteid = req.params.athleteid;
    const statistics = req.body;  // Now, req.body will contain a flat structure with statistic_<statisticid>
  
    // Make sure there is at least one statistic to update
    if (!statistics || Object.keys(statistics).length === 0) {
      return res.status(400).send('No statistics provided.');
    }
  
    try {
      // Loop through all the statistic values in the request body
      const updatePromises = Object.keys(statistics).map((key) => {
        // Extract the statistic ID from the key
        const statisticid = key.replace('statistic_', '');  // Extract statisticid from "statistic_<id>"
  
        // Get the value for that statistic
        const statisticValue = statistics[key];
  
        // Update the statistic in the athletestatistics table
        return knex('athletestatistics')
          .where({ athleteid: athleteid, statisticid: statisticid })
          .update({ statistic: statisticValue });
      });
  
      // Wait for all updates to complete
      await Promise.all(updatePromises);
  
      // Redirect to the athlete's basketball stats page
      res.redirect(`/statsAthlete/${athleteid}`);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating football statistics.');
    }
  });
  
  
  



// Start the server
app.listen(port, () => console.log("Athlete Express App has started and server is listening on port 3500!"));
