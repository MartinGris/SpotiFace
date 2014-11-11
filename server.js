#!/bin/env node

var express = require('express');
var app = express();
var http = require('http').Server(app);
var mysql = require('mysql');
var io = require('socket.io')(http); 

app.use(express.static(__dirname + '/public'));

app.set('view engine', 'ejs');

var db = mysql.createConnection(
    {
      host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
      user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
      password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
      database : 'chat',
    }
);

db.connect(function(err){
    if (err) console.log(err)
});


var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;

passport.use(new FacebookStrategy({
    clientID: '656991001080494',
    clientSecret: '57762c91c1d1bc4ed348334a19b7a015',
    callbackURL: "http://spotiface-grisard.rhcloud.com/spoti"
  },
  function(accessToken, refreshToken, profile, done) {
   // User.findOrCreate(..., function(err, user) {
     // if (err) { return done(err); }
   //   done(null, user);
    //});
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
                                      failureRedirect: '/login' }));


app.get('/', function(req, res){
    console.log('hello world');

	db.query('SELECT * FROM message', function(err, rows){
		if(err)
           console.log("Error Selecting : %s ",err );
		     
        console.log(rows);
		res.render('index',{data:rows});
	
	});

});

app.get('/spoti', function(req, res){
    console.log('spoti');
	res.render('spoti');
	
});

io.on('connection', function(socket){
	console.log('a user connected');

	socket.on('send chat message', function(msg){
		var now = new Date();
		var data = {
			content   : msg,
			date   :  now    
        };
	
		var query = db.query("INSERT INTO message set ? ",data, function(err, rows){
            if (err)
				console.log("Error inserting : %s ",err );
        });

    	io.emit('new chat message', data);
  	});

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

