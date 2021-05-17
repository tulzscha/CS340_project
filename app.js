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





/*
    ROUTES
*/
app.get('/index', function(req, res){

    res.render('index')

    });


app.get('/encounters', function(req, res){

    res.render('encounters')

    });
    

app.get('/bears', function(req, res){

    res.render('bears')

    });


// HUMANS PAGE ROUTES
// get route, display page with data
app.get('/humans', function(req, res){

    var selectHumans = "SELECT encounterID, firstName, lastName, date_format(birthday,'%Y-%m-%d') AS birthday FROM Humans";
    var encounterIDs = "SELECT encounterID FROM Encounters"
    var context = {};
    var page_data = {};

    // Query to get the current humans
    db.pool.query(selectHumans, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate page_data with Humans, where each human is the data from the "rows" result of the query
        page_data.humans = [];
        for (row in rows) {
            human = {};

            human.encounterID      = rows[row].encounterID;
            human.firstName    = rows[row].firstName;
            human.lastName    = rows[row].lastName;
            human.birthday  = rows[row].birthday;

            page_data.humans.push(human);
        }

        });

    // Query to get the available encoutnerIDs
    db.pool.query(encounterIDs, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate data with EncounterIDs, where each ID is the data from the "rows" result of the query
        page_data.encounters = [];

        for (row in rows) {
            encounter = {};
            encounter.encounterID      = rows[row].encounterID;
            page_data.encounters.push(encounter);
        }

        });

    // Load data into the context
    context.data = page_data;

    //render unto keysar
    res.render('humans', context);

});

// Humans POST route
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

    res.redirect('back');

});




// PARKS ROUTES
    
app.get('/parks', function(req, res){

    var selectParks = "SELECT ParkID, parkName, state, annualVisitorCount FROM Parks";
    var encounterIDs = "SELECT encounterID FROM Encounters";
    var parkNames = "SELECT parkName FROM Parks";
    var context = {};
    var page_data = {};

    // Query to get the current humans
    db.pool.query(selectParks, function(err, rows){

        if(err){
            next(err);
            return;
        }

        // populate page_data with Humans, where each human is the data from the "rows" result of the query
        page_data.parks = [];

        for (row in rows) {
            park = {};

            park.parkID      = rows[row].ParkID;
            park.parkName    = rows[row].parkName;
            park.state    = rows[row].state;
            park.annualVisitorCount  = rows[row].annualVisitorCount;

            page_data.parks.push(park);
        }

    });


    // Query to get the available encoutnerIDs
    db.pool.query(encounterIDs, function(err, rows){

        if(err){
            next(err);
            return;
        }
        
        // populate data with EncounterIDs, where each ID is the data from the "rows" result of the query
        page_data.encounters = [];
        for (row in rows) {
            encounter = {};
            encounter.encounterID      = rows[row].encounterID;
            page_data.encounters.push(encounter);
        }

    });


    // Query to get the available park names
    db.pool.query(parkNames, function(err, rows){

        if(err){
            next(err);
            return;
        }
        
        // populate data with parknames
        page_data.parknames = [];

        for (row in rows) {
            parkname = {};
            parkname.parkID      = rows[row].parkID;
            parkname.parkName      = rows[row].parkName;
            page_data.parknames.push(parkname);
        }

    });


    context.data = page_data;
    res.render('parks', context);

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

    res.redirect('back');

});







app.get('/bear_encounters', function(req, res){

    res.render('bear_encounters')
    
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