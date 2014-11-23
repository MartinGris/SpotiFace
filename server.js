#!/bin/env node

// var express = require('express');

// var bodyParser = require('body-parser');
// var cookieParser = require('cookie-parser');
// var session      = require('express-session');
// var MongoStore = require('connect-mongo')(session);

// var mongoose = require('mongoose');

var express = require('express');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
  
var sdk = require('facebook-node-sdk');

var app = express();

// must use cookieParser before expressSession
app.use(cookieParser('Mast3rOfD3sast3r'));

app.use(expressSession({secret:'Mast3rOfD3sast3r'}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));


var EVENTID = '714934911932512';

var http = require('http').Server(app);
var io = require('socket.io')(http); 

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(cookieParser());

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

var fbApi;

passport.use(new FacebookStrategy({
    clientID: '656991001080494',
    clientSecret: '57762c91c1d1bc4ed348334a19b7a015',
    callbackURL: "http://spotiface-grisard.rhcloud.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    
    fb = new sdk({
            appId: '656991001080494',
            secret: '57762c91c1d1bc4ed348334a19b7a015'
        }).setAccessToken(accessToken);
    
    
    console.log(accessToken);
    process.nextTick(function() {
        // console.log(profile.name.givenName);
        // console.log(profile);
                
        var id = profile.id;
                
        fb.api('/' + id + '/events/attending', function(err, data) {
            if (err) {
              console.log(err);
              return;
            }
            if (data) {
                if( isEventAttending( data.data ) ){
                    return done(null, profile);
                }
                else{
                    return done(null, false);
                }
            }
        });
        
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


app.get('/', function(req, res){
  res.render('index',{});
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'user_events' }));

app.post('/', function(req, res){
  req.session.userName = req.body.userName;
  res.redirect('/');
});

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/success',
  failureRedirect: '/error'
}));
 
app.get('/success', ensureAuthenticated, function(req, res, next) {
  res.send('Successfully logged in. <a href="/logout"> LOGOUT </a>');
});
 
app.get('/error', function(req, res, next) {
  res.send("Error logging in.");
});

app.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});
// app.get('/spoti', ensureAuthenticated, function(req, res){
app.get('/spoti', function(req, res){
    console.log('spoti');
    res.render('spoti');

});

start();


function isEventAttending( data ){
    console.log('debug1');
    console.log('data length: ' + data.length);
    for( var i = 0; i < data.length; i++ ){
        var event = data[i];
        console.log( 'event data: ' + event);
        console.log( 'event id: ' + event.id);
        if( event.id == EVENTID){
            return true;
        }
    }
    return false;
}


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next(); 
    }
    res.redirect('/')
}

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

function start(){
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

}




