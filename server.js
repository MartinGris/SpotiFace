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


var EVENTID = '714934911932513';

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
                if( isEventAttending( data ) ){
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

// { id: '768625053173263',
  // username: undefined,
  // displayName: 'Martin Gri',
  // name: { familyName: 'Gri', givenName: 'Martin', middleName: undefined },
  // gender: 'male',
  // profileUrl: 'https://www.facebook.com/app_scoped_user_id/768625053173263/',
  // provider: 'facebook',
  // _raw: '{"id":"768625053173263","first_name":"Martin","gender":"male","last_name":"Gri","link":"https:\\/\\/www.facebook.com\\/app_scoped_user_id\\/768625053173263\\/","locale":"en_GB","name":"Martin Gri","timezone":1,"updated_time":"2$
  // _json:
   // { id: '768625053173263',
     // first_name: 'Martin',
     // gender: 'male',
     // last_name: 'Gri',
     // link: 'https://www.facebook.com/app_scoped_user_id/768625053173263/',
     // locale: 'en_GB',
     // name: 'Martin Gri',
     // timezone: 1,
     // updated_time: '2014-10-27T15:08:25+0000',
     // verified: true } }
// { data:
   // [ { location: 'Partykeller Wickede',
       // name: 'Geburtstagsfeierei',
       // start_time: '2014-11-29T21:00:00+0100',
       // timezone: 'Europe/Berlin',
       // id: '714934911932512',
       // rsvp_status: 'attending' },
     // { end_time: '2014-11-21T07:30:00+0100',
       // location: 'Hafenschänke subrosa',
       // name: 'open stage: TALENTSCHUPPEN',
       // start_time: '2014-11-20T19:30:00+0100',
       // timezone: 'Europe/Berlin',
       // id: '212460612213440',
       // rsvp_status: 'attending' },
     // { location: 'Dortmund Asseln',
       // name: 'Partygaragengeburtstagsparty',
       // start_time: '2014-11-14T20:00:00+0100',
       // id: '1480626448891345',
       // rsvp_status: 'attending' } ],
  // paging:
   // { cursors:
      // { before: 'T0Rnd01UZzJOVGN5TURFMU9ETTRPakUwTWpNNU5EQTBNREE2TVRZMU1EZzBPRGsyT0RRNE5UZ3g=',
        // after: 'TVRRNE1EWXlOalEwT0RnNU1UTTBOVG94TkRFMU9Ua3hOakF3T2pFMk5UQTRORGc1TmpnME9EVTRNUT09' },
     // next: 'https://graph.facebook.com/v2.2/768625053173263/events?access_token=CAAJVh6M9cq4BAAdzZB04Jym5el1iJaOvt6JBLatyXLr3sSMkJmZCBh5Z }}


function isEventAttending( data ){
    console.log('debug1');
    console.log('data length: ' + data.data.length);
    for( var i = 0; i < data.data.length; i++ ){
        var event = data.data[i];
        console.log( 'event data: ' + event);
        console.log( 'event id: ' + event.id);
        if( event.id == EVENTID){
            return true;
        }
    }
    return false;
}







// router.get('/', function(req, res){
    // console.log('hello world');
    // res.render('index',{});
    // res.json({ message: 'hooray! welcome to our api!' });
	// db.query('SELECT * FROM message', function(err, rows){
		// if(err)
           // console.log("Error Selecting : %s ",err );
		     
        // console.log(rows);
		// res.render('index',{data:rows});
	
	// });

// });

// app.use('/', router);

// app.use(passport.initialize());
// app.use(passport.session({
    // resave: true,
    // saveUninitialized: true
// }));


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



// passport.serializeUser(function(user, done) {
  // done(null, user.id);
// });

// passport.deserializeUser(function(id, done) {
  // User.findById(id, function(err, user) {
    // done(err, user);
  // });
// });  
  
  
// passport.use(new FacebookStrategy({
    // clientID: '656991001080494',
    // clientSecret: '57762c91c1d1bc4ed348334a19b7a015',
    // callbackURL: "http://spotiface-grisard.rhcloud.com/spoti"
  // },
  // function(accessToken, refreshToken, profile, done) {
    // console.log(accessToken);
  
    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      // return done(err, user);
    // });
  // }
// ));


// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback

// app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.


// app.get('/auth/facebook/callback', 
  // passport.authenticate('facebook', { successRedirect: '/',
                                      // failureRedirect: "http://spotiface-grisard.rhcloud.com" }));




// app.get('/spoti', ensureAuthenticated, function(req, res){
    // console.log('spoti');
   
    // User.findById(req.session.passport.user, function(err, user) {
        // if(err) {
            // console.log(err);
        // } else {
        	// res.render('spoti', { user: user});
            
        // }
	// });
// });

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



function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()){
        return next(); 
    }
    res.redirect('/')
}

