#!/bin/env node

var FACEBOOKCLIENTID = '1234';
var FACEBOOKSECRET = '1234';
var CALLBACKURL = 'http://test/auth/facebook/callback';
var EVENTID = '1234';

var SONGLIMIT = 3;

var express = require('express');
var bodyParser = require('body-parser'); 
var expressSession = require('express-session');
var cookieParser = require('cookie-parser'); 
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
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

var db = mysql.createConnection(
	    {
	      host     : 'host',
	      user     : 'user',
	      password : 'password',
	      database : 'database',
	    }
	);

db.connect(function(err){
    if (err) console.log(err)
})

var fbApi;

passport.use(new FacebookStrategy({
    clientID: FACEBOOKCLIENTID,
    clientSecret: FACEBOOKSECRET,
    callbackURL: CALLBACKURL
  },
  function(accessToken, refreshToken, profile, done) {
    
	  fbApi = new sdk({
            appId: FACEBOOKCLIENTID,
            secret: FACEBOOKSECRET
        }).setAccessToken(accessToken);
    
    process.nextTick(function() {
        console.log( "userlogin: " + profile.name.givenName );
                
        var id = profile.id;
                
        fbApi.api('/' + id + '/events/attending', function(err, data) {
            if (err) {
              console.log(err);
              return;
            }
            if (data) {
            	
            	var evalResultFunction = function( result ){
            		if( result ){
            			return done(null, profile);
            		}
            		else{
            			return done(null, false);
            		}
            	}
            	
            	isEventAttending( data, profile, evalResultFunction )
            	
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
  res.render('index',{errorMessage: ""});
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
 
app.get('/error', function(req, res, next) {
	res.render('index',{errorMessage: "Login failed dude!"});
});

app.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

app.get('/spoti', ensureAuthenticated, function(req, res, next){
//	db.query('SELECT * FROM user_song WHERE user_id = ?', [res.req.user.id], function(err, rows){
//		if(err){
//			console.log("Error Selecting : %s ",err );
//		}
		
		res.render('spoti', { userId: res.req.user.id });
		
//	});

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
		res.status(403).send('Manipulate your own songlist, motherfucker!')
		return;
	}
	else{
		return callback();
	}
}

function isEventAttending( data, profile, callback ){
	var events = data.data;
    for( var i = 0; i < events.length; i++ ){
        var event = events[i];
        console.log( 'event id: ' + event.id);
        if( event.id == EVENTID){
        	console.log( "Event found!" );
        	return callback( true );
        }
    }
    if( data.paging.next ){
        fbApi.api('/' + profile.id + '/events/attending',{ after: data.paging.cursors.after }, function(err, data) {
            if (err) {
              console.log(err);
              return callback( false );
            }
            isEventAttending( data, profile, callback );
        });
    }
    else{
    	console.log("return false");
    	return callback( false );
    }
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




