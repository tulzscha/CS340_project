/*
    SETUP
*/
// Express
var express = require('express');   // We are using the express library for the web server
var app     = express();            // We need to instantiate an express object to interact with the server in our code
var PORT    = 65157;


// Database
var db = require('./db-connector')


// Handlebars
var handlebars = require('express-handlebars').create({defaultLayout:'main'});

app.use(express.static('public'))
app.use(express.urlencoded())

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', PORT);





// ====================================================================================
// Index ROUTE
// ====================================================================================
app.get('/index', function(req, res){

    res.render('index')

    });


// ====================================================================================
// ENCOUNTERS ROUTES
// ====================================================================================

app.get('/encounters', function(req, res, next){

    var selectEncounters2 = "SELECT en.encounterID AS enID, (SELECT parkName FROM Parks WHERE parkID = en.parkID) AS Park, date_format(en.encounterDate, '%Y-%m-%d') AS Date, en.basketsStolen AS BasketsStolen, en.photosTaken AS PhotosTaken, en.description AS Description, GROUP_CONCAT(DISTINCT be.bearName SEPARATOR ', ') AS Bears, GROUP_CONCAT(DISTINCT CONCAT(hu.firstName, ' ', hu.lastName) SEPARATOR ', ') AS Humans FROM Encounters en JOIN Encounters_Bears enbe ON en.encounterID = enbe.encounterID JOIN Bears be ON enbe.bearID = be.bearID JOIN Humans hu ON hu.encounterID = en.encounterID GROUP BY enID";
    var selectParks = "SELECT * FROM Parks";
    var selectBears = "SELECT * FROM Bears";
    var selectEncounters = "SELECT * FROM Encounters";
    var encounter_context = {};
    var encounter_page_data = {};

    // 
    db.pool.query(selectEncounters2, function(err, rows){

        if(err){
            next(err);
            return;
        }
        encounter_page_data.encounters = [];
        for (row in rows) {
            encounter = {};

            encounter.enID      = rows[row].enID;
            encounter.Park    = rows[row].Park;
            encounter.Date    = rows[row].Date;
            encounter.BasketsStolen  = rows[row].BasketsStolen;
            encounter.PhotosTaken = rows[row].PhotosTaken;
            encounter.Description = rows[row].Description;
            encounter.Bears = rows[row].Bears;
            encounter.Humans = rows[row].Humans;

            encounter_page_data.encounters.push(encounter);

        }
    db.pool.query(selectParks, function(err, rows){

        if(err){
            next(err);
            return;
        }
    
        encounter_page_data.parks = [];
    
        for (row in rows) {
            park = {};
            park.parkName      = rows[row].parkName;
            encounter_page_data.parks.push(park);
        }
    
    });

    db.pool.query(selectBears, function(err, rows){

        if(err){
            next(err);
            return;
        }
    
        encounter_page_data.bears = [];
    
        for (row in rows) {
            bear = {};
            bear.bearID      = rows[row].bearID;
            bear.bearName      = rows[row].bearName;
            encounter_page_data.bears.push(bear);
        }
    
    });

    db.pool.query(selectEncounters, function(err, rows){

        if(err){
            next(err);
            return;
        }
    
        encounter_page_data.allencounters = [];
    
        for (row in rows) {
            allencounter = {};
            allencounter.encounterID      = rows[row].encounterID;
            encounter_page_data.allencounters.push(allencounter);
        }
    
    });

    // Load data into the context
    encounter_context.data = encounter_page_data;

    //render unto keysar
    res.render('encounters', encounter_context);
    });

});

    
// Add encounters POST route to create new encounter
app.post('/addencounter', function(req,res,next){
    
    console.log("This is the body," + req.body)
    var findParkId = "SELECT parkID FROM Parks WHERE parkName = '" + req.body.parkID + "'";
    var createEncounter = "INSERT INTO Encounters (`parkID`, `encounterDate`, `basketsStolen`, `photosTaken`, `description` ) VALUES (?, ?, ?, ?, ?)";
    var encounterdate = req.body.encounterdate;
    var baskets = req.body.baskets;
    var photos = req.body.photos;
    var description = req.body.description;
    var park = {};

    function printvars(var1, var2, var3, var4, var5){
        return new Promise(function(resolve, reject){
            resolve(console.log("This is the id found in query outside query call, " + var5));
            resolve(console.log("These are all the variables, " + var1, var2, var3, var4, var5));
        });
    }

    function createquery(createEncounter, var1, var2, var3, var4, var5){
        return new Promise(function(resolve, reject) {
            db.pool.query(createEncounter, [var1, var2, var3, var4, var5], function(err, result){
                if(err){
                    next(err);
                }   
                resolve(console.log("ok"));
            });
        });
    }

    function waitquery(findParkId){
        return new Promise(function(resolve, reject) {
            db.pool.query(findParkId, function(err, rows){
                park.data = [];
        
                if(err){
                    next(err);
                }
                for (row in rows) {
                    park.data.push(rows[row].parkID);
                }
                resolve(console.log("This is the id found in query, " + park.data));
        
        
            });
        })
    }

    // finds the park id associated with given park name
    function doquery(){
        return waitquery(findParkId);
    }

    // prints variables so we can check that they are correct (for testing purposes)
    function doprintvars(){
        return printvars(encounterdate, baskets, photos, description, park.data[0]);
    }

    function docreate(){
        createquery(createEncounter, park.data[0], encounterdate, baskets, photos, description);
    }

    // first, find id that matches park name, then make sure those values are correct by printing to console, 
    // finally, create the encounter. woo!
    doquery().then(doprintvars).then(docreate);

    res.redirect(302, 'back');
});


// Add Bear to Encounter POST route
app.post('/addBearToEncounter', function(req,res,next){
    
    console.log(req.body)
    
    var addBearToEncounter = "INSERT INTO Encounters_Bears (bearID, encounterID) VALUES (?, ?)";
    var {bearID, encounterID} = req.body

    db.pool.query(addBearToEncounter, [bearID, encounterID], function(err, result){
        
        if(err){
            next(err);
            return;
        }
        });

        res.redirect(302, 'back');

});


// Add Bear to Encounter POST route
app.post('/removeBearFromEncounter', function(req,res,next){
    
    console.log(req.body)
    
    var removeBearFromEncounter = "DELETE FROM Encounters_Bears WHERE bearID = ? AND encounterID = ?";
    var {bearID, encounterID} = req.body

    db.pool.query(removeBearFromEncounter, [bearID, encounterID], function(err, result){
        
        if(err){
            next(err);
            return;
        }
        });

        res.redirect(302, 'back');

});







// ====================================================================================
// BEARS ROUTES
// ====================================================================================

// get route, display page with data
app.get('/bears', function(req, res){

    var selectBears = "SELECT bearID, bearName, species, identifyingTattoos FROM Bears";
    var bear_context = {};
    var bear_page_data = {};

    // Query to get the current humans
    db.pool.query(selectBears, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate page_data with Bears, where each bear is the data from the "rows" result of the query
        bear_page_data.bears = [];
        for (row in rows) {
            bear = {};

            bear.bearID = rows[row].bearID;
            bear.bearName = rows[row].bearName;
            bear.species = rows[row].species;
            bear.identifyingTattoos = rows[row].identifyingTattoos;

            bear_page_data.bears.push(bear);
        }

        // Load data into the context
        bear_context.data = bear_page_data;

        //render unto THE BEAR
        res.render('bears', bear_context);

    });
});

// Add Bear POST route
app.post('/addbear', function(req,res,next){
    
    console.log(req.body)
    
    var createBear = "INSERT INTO Bears (`bearName`, `species`, `identifyingTattoos`) VALUES (?, ?, ?)";
    var {bearname, species, tattoos} = req.body

    db.pool.query(createBear, [bearname, species, tattoos], function(err, result){
        
        if(err){
            next(err);
            return;
        }
        });

        res.redirect(302, 'back');

});


// Search Bear POST route
app.post('/bearsearch', function(req,res,next){
    
    console.log(req.body)
    
    var term = req.body.bearsearch

    var searchBear = "SELECT bearID, bearName, species, identifyingTattoos FROM Bears WHERE bearName LIKE '%" + term + "%' OR species LIKE '%" + term + "%' OR identifyingTattoos LIKE '%" + term + "%'";
    var search_context = {};
    var search_page_data = {};

    console.log(searchBear);

    db.pool.query(searchBear, function(err, rows){
        
        if(err){
            next(err);
            return;
        }

        // populate page_data with Bears, where each bear is the data from the "rows" result of the query
        search_page_data.bears = [];
        for (row in rows) {
            bear = {};

            bear.bearID = rows[row].bearID;
            bear.bearName = rows[row].bearName;
            bear.species = rows[row].species;
            bear.identifyingTattoos = rows[row].identifyingTattoos;

            search_page_data.bears.push(bear);
        }

        // Load data into the context
        search_context.data = search_page_data;

        //render unto keysar
        res.render('search_results', search_context);

    });

});

// UPDATE Bear POST route
app.post('/updatebear', function(req,res,next){
    
    console.log(req.body)
    
    var bearID = req.body.bearID;
    var species = req.body.species;
    var tattoos = req.body.identifyingTattoos;

    var updateBear = "UPDATE Bears SET species = '" + species + "', identifyingTattoos = '" + tattoos + "' WHERE bearID = " + bearID;

    console.log(updateBear);

    db.pool.query(updateBear, function(err, result){
        if(err){
            next(err);
            return;
        }
    });

    res.redirect(302, 'back');

});





// ====================================================================================
// HUMANS ROUTES
// ====================================================================================

// get route, display page with data
app.get('/humans', function(req, res){

    var selectHumans = "SELECT encounterID, firstName, lastName, date_format(birthday,'%Y-%m-%d') AS birthday FROM Humans";
    var encounterIDs = "SELECT encounterID FROM Encounters"
    var human_context = {};
    var human_page_data = {};

    // Query to get the current humans
    db.pool.query(selectHumans, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate page_data with Humans, where each human is the data from the "rows" result of the query
        human_page_data.humans = [];
        for (row in rows) {
            human = {};

            human.encounterID      = rows[row].encounterID;
            human.firstName    = rows[row].firstName;
            human.lastName    = rows[row].lastName;
            human.birthday  = rows[row].birthday;

            human_page_data.humans.push(human);
        }

        });

    // Query to get the available encoutnerIDs
    db.pool.query(encounterIDs, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate data with EncounterIDs, where each ID is the data from the "rows" result of the query
        human_page_data.encounters = [];

        for (row in rows) {
            encounter = {};
            encounter.encounterID      = rows[row].encounterID;
            human_page_data.encounters.push(encounter);
        }

        });

    // Load data into the context
    human_context.data = human_page_data;

    //render unto keysar
    res.render('humans', human_context);

});

// Humans POST route, for adding a human
app.post('/addhumans', function(req,res,next){
    
    console.log(req.body)
    
    var createHuman = "INSERT INTO Humans (`encounterID`, `firstName`, `lastName`, `birthday`) VALUES (?, ?, ?, ?)";
    var {encounterID, fname, lname, bday} = req.body

    db.pool.query(createHuman, [encounterID, fname, lname, bday], function(err, result){
        
    if(err){
        next(err);
        return;
    }
    });

    res.redirect(302, 'back');

});


// ====================================================================================
// PARKS ROUTES
// ====================================================================================

// Display page, with data and dropdowns filled    
app.get('/parks', function(req, res){

    var selectParks = "SELECT ParkID, parkName, state, annualVisitorCount FROM Parks";
    var encounterIDs = "SELECT encounterID FROM Encounters";
    var parkNames = "SELECT parkName FROM Parks";
    var park_context = {};
    var park_page_data = {};

    // Query to get the current humans
    db.pool.query(selectParks, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate page_data with Humans, where each human is the data from the "rows" result of the query
        park_page_data.parks = [];

        for (row in rows) {
            park = {};

            park.parkID      = rows[row].ParkID;
            park.parkName    = rows[row].parkName;
            park.state    = rows[row].state;
            park.annualVisitorCount  = rows[row].annualVisitorCount;

            park_page_data.parks.push(park);
        }

    });

    // Query to get the available encoutnerIDs
    db.pool.query(encounterIDs, function(err, rows){

        if(err){
            next(err);
            return;
        }
        
        // populate data with EncounterIDs, where each ID is the data from the "rows" result of the query
        park_page_data.encounters = [];
        for (row in rows) {
            encounter = {};
            encounter.encounterID      = rows[row].encounterID;
            park_page_data.encounters.push(encounter);
        }

    });

    // Query to get the available park names
    db.pool.query(parkNames, function(err, rows){

        if(err){
            next(err);
            return;
        }
        
        // populate data with parknames
        park_page_data.parknames = [];

        for (row in rows) {
            parkname = {};
            parkname.parkID      = rows[row].parkID;
            parkname.parkName      = rows[row].parkName;
            park_page_data.parknames.push(parkname);
        }

    });

    // add data to context, render
    park_context.data = park_page_data;
    res.render('parks', park_context);

    // setTimeout((() => {
    //     park_context.data = park_page_data;
    //     res.render('parks', park_context);
    //  }), 1000);

});

// Add Park Humans POST route
app.post('/addpark', function(req,res,next){
    
    console.log(req.body)
    
    var createPark = "INSERT INTO Parks (`parkName`, `state`, `annualVisitorCount`) VALUES (?, ?, ?)";
    var {pname, sname, annualVisitorCount} = req.body

    db.pool.query(createPark, [pname, sname, annualVisitorCount], function(err, result){
        
    if(err){
        next(err);
        return;
    }
    });

    res.redirect(302, 'back');

});

// Remove Park From Encounter route
app.post('/removeParkFromEncounter', function(req,res,next){
    
    console.log(req.body)

    var encounterID = req.body.encounterID
    var removeParkFromEncounter = "UPDATE Encounters SET parkID = NULL WHERE encounterID = " + encounterID;

    db.pool.query(removeParkFromEncounter, function(err, result){
        
    if(err){
        next(err);
        return;
    }
    });

    res.redirect(302, 'back');

});

// Remove Park From Encounter route
app.post('/addParkToEncounter', function(req,res,next){
    
    console.log(req.body)

    var updateEncounterID = req.body.updateEncounterID
    var updateParkID = req.body.updateParkID
    var updateParkEncounter = "UPDATE Encounters SET parkID = " + updateParkID + " WHERE encounterID = " + updateEncounterID;

    db.pool.query(updateParkEncounter, function(err, result){
        
    if(err){
        next(err);
        return;
    }
    });

    res.redirect(302, 'back');

});




/*
    ERRERS
*/
// 404 handlebar
app.use(function(req,res){
    res.status(404);
    res.render('404');
  });
  
// 500 handlebar
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});
  
/*
    LISTENER
*/
app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});