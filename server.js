#!/bin/env node

var EVENTID = '834220376624898';
var SONGLIMIT = 3;

var express = require('express');
var bodyParser = require('body-parser'); // for reading POSTed form data into `req.body`
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); // the session is stored in a cookie, so we use this to parse it
var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
  
var sdk = require('facebook-node-sdk');

var mysql = require('mysql');

var app = express();

// must use cookieParser before expressSession
app.use(cookieParser('Mast3rOfD3sast3r'));

app.use(expressSession({secret:'Mast3rOfD3sast3r'}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({ extended: true }));


var http = require('http').Server(app);
var io = require('socket.io')(http); 

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

var db = mysql.createConnection(
	    {
	      host     : '93.157.51.165',
	      user     : 'spotiUser',
	      password : '3rdf3rk3lSpoti',
	      database : 'spotiface',
	    }
	);

db.connect(function(err){
    if (err) console.log(err)
})

var fbApi;

passport.use(new FacebookStrategy({
    clientID: '656991001080494',
    clientSecret: '57762c91c1d1bc4ed348334a19b7a015',
    callbackURL: "http://spotiface-grisard.rhcloud.com/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    
	  fbApi = new sdk({
            appId: '656991001080494',
            secret: '57762c91c1d1bc4ed348334a19b7a015'
        }).setAccessToken(accessToken);
    
    
    console.log(accessToken);
    process.nextTick(function() {
        // console.log(profile.name.givenName);
        // console.log(profile);
                
        var id = profile.id;
                
        fbApi.api('/' + id + '/events/attending', function(err, data) {
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
  successRedirect: '/spoti',
  failureRedirect: '/error'
}));
 
app.get('/success', ensureAuthenticated, function(req, res, next) {
  res.send('Successfully logged in. <a href="/logout"> LOGOUT </a>');
});
 
app.get('/error', function(req, res, next) {
  res.send("Login failed");
});

app.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});
// app.get('/spoti', ensureAuthenticated, function(req, res){
app.get('/spoti', ensureAuthenticated, function(req, res, next){
	db.query('SELECT * FROM user_song WHERE user_id = ?', [res.req.user.id], function(err, rows){
		if(err){
			console.log("Error Selecting : %s ",err );
		}
		
		res.render('spoti', { userId: res.req.user.id, songs: rows});
		
	});

});


app.get('/spoti/user/:id/songs', ensureAuthenticated, function(req, res, next){
	
	var userId = req.params.id;

	secureApi(res, userId, function(){
		
		db.query('SELECT * FROM user_song WHERE user_id = ?', [userId], function(err, rows){
			if(err){
				console.log("Error Selecting : %s ",err );
			}
			
			res.send(rows);
			
		});
		
	});

});

app.put('/spoti/user/:id/songs', ensureAuthenticated, function(req, res, next){
	
	var userId = req.params.id;
	var songId = req.body.songId;
	var userName;
	
	secureApi(res, userId, function(){
		
		db.query('SELECT * FROM user_song WHERE user_id = ?', [userId], function(err, rows){
			if(err){
				console.log("Error Selecting : %s ",err );
			}
			
			if( rows.length == 3 ){
				res.status(423).send('You have already ' + SONGLIMIT + ' songs in your list dude!')
				return;
			}
			for( var i = 0; i < rows.length; i++ ){
				if( rows[i].song_id === songId ){
					console.log("song already in list");
					res.status(423).send('This song is already in your list dude!')
					return;
				}
			}
			
	        var getUserName = function( callback ){
	        	
	        	fbApi.api('/me', function(err, data) {
	        		if (err) {
	        			console.log(err);
	        			return;
	        		}
	        		if (data) {
	        			callback( data.name );
	        		}
	        	});
	        }; 
	        	
	        var saveInDb = function( username ){
	        	console.log( username );
	        	var data = {
	        			user_id   : userId,
	        			song_id   :  songId,
	        			user_name :	username
	        	};
	        	var query = db.query("INSERT INTO user_song set ? ",data, function(err, rows){
	        		if (err){
	        			console.log("Error inserting : %s ",err );
	        		}
	        	});
	        };
			
	        getUserName( saveInDb );
	        
			
			res.send( songId );
			
		});
		
	});
	
});

app.delete('/spoti/user/:id/songs', ensureAuthenticated, function(req, res, next){
	
	var userId = req.params.id;
	var songId = req.body.songId;
	
	secureApi(res, userId, function(){
		
		db.query('DELETE FROM user_song WHERE user_id = ? and song_id = ?', [userId, songId], function(err, rows){
			if(err){
				console.log("Error Selecting : %s ",err );
			}
			
			res.send(songId);
			
		});
		
	});
	
});

start();

function secureApi(res, id, callback){
	if( res.req.user.id != id ){
		console.log("cross usage of api is not allowed");
		res.status(403).send('manipulate your own songlist, motherfucker!')
		return;
	}
	else{
		return callback();
	}
}

function isEventAttending( data ){
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
	console.log("authentication check");
    if (req.isAuthenticated()){
        return next(); 
    }
    res.redirect('/');
}

function start(){
    var ipaddress = process.env.OPENSHIFT_NODEJS_IP;
    var port      = process.env.OPENSHIFT_NODEJS_PORT;

    if (typeof ipaddress === "undefined") {
        //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
        //  allows us to run/test the app locally.
        console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
        ipaddress = "127.0.0.1";
        port = 8080;
    }


    http.listen(port, ipaddress, function(){
      console.log('listening on :' + port );
    });

}




