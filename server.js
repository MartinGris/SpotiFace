#!/bin/env node

var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var http = require('http').Server(app);
// var mysql = require('mysql');
var io = require('socket.io')(http); 

var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;


app.use(express.static(__dirname + '/public'));

app.use(express.static('public'));
app.use(cookieParser);
app.use(bodyParser);
app.use(session({ secret: '!mast3rOfDes4st3r!' }));
app.use(passport.initialize());
app.use(passport.session());
// app.use(app.router);




app.set('view engine', 'ejs');

// var db = mysql.createConnection(
    // {
      // host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
      // user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
      // password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
      // database : 'chat',
    // }
// );

// db.connect(function(err){
    // if (err) console.log(err)
// });



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});  
  
  
passport.use(new FacebookStrategy({
    clientID: '656991001080494',
    clientSecret: '57762c91c1d1bc4ed348334a19b7a015',
    callbackURL: "http://spotiface-grisard.rhcloud.com/spoti"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(accessToken);
  
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: "http://spotiface-grisard.rhcloud.com" }));


app.get('/', function(req, res){
    console.log('hello world');
    res.render('index');
    
	// db.query('SELECT * FROM message', function(err, rows){
		// if(err)
           // console.log("Error Selecting : %s ",err );
		     
        // console.log(rows);
		// res.render('index',{data:rows});
	
	// });

});

app.get('/spoti', ensureAuthenticated, function(req, res){
    console.log('spoti');
   
    User.findById(req.session.passport.user, function(err, user) {
        if(err) {
            console.log(err);
        } else {
        	res.render('spoti', { user: user});
            // res.render('account', { user: user});
        }
	});
});

io.on('connection', function(socket){
	console.log('a user connected');

	// socket.on('send chat message', function(msg){
		// var now = new Date();
		// var data = {
			// content   : msg,
			// date   :  now    
        // };
	
		// var query = db.query("INSERT INTO message set ? ",data, function(err, rows){
            // if (err)
				// console.log("Error inserting : %s ",err );
        // });

    	// io.emit('new chat message', data);
  	// });

  	socket.on('disconnect', function(){
    	console.log('user disconnected');
  	});
});

var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
var port      = process.env.OPENSHIFT_NODEJS_PORT;

if (typeof ipaddress === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
    ipaddress = "127.0.0.1";
}


http.listen(port, ipaddress, function(){
  console.log('listening on :' + port );
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next(); 
    }
    res.redirect('/')
}

