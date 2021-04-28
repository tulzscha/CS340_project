/*
    SETUP
*/
// Express
var express = require('express');   // We are using the express library for the web server
var app     = express();            // We need to instantiate an express object to interact with the server in our code
var PORT    = 65155;


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


app.get('/humans', function(req, res){

    res.render('humans')

    });


app.get('/parks', function(req, res){

    res.render('parks')

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