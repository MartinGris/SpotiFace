#!/bin/env node

var express = require('express');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var MongoStore = require('connect-mongo')(session);

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    cookie: { maxAge: 1000*60*2 } , // 2 Minuten
    secret: "session secret" ,
    store:new MongoStore({
            db: 'express',
            host: OPENSHIFT_MONGODB_DB_HOST,
            port: OPENSHIFT_MONGODB_DB_PORT,  
            username: OPENSHIFT_MONGODB_DB_USERNAME,
            password: OPENSHIFT_MONGODB_DB_PASSWORD, 
            collection: 'session', 
            auto_reconnect:true
    })
}));

// var passport = require('passport')
  // , FacebookStrategy = require('passport-facebook').Strategy;


app.use(express.static(__dirname + '/public'));


app.use(express.static('public'));
// app.use(cookieParser);
// app.use(bodyParser);
// app.use(session({ secret: '!mast3rOfDes4st3r!' }));


app.set('view engine', 'ejs');

var router = express.Router(); 	

app.get('/', function(req, res){
  // res.sendfile('./index.html');
  res.render('index',{});
});
app.post('/',function(req,res){
  req.session.name=req.body.name;
  res.redirect('/info');
});
app.get('/info',function(req,res){
  res.send('<div style="color:red;font-size:30;">'+req.session.name+'</div>'+'<div><a href="/">back</a></div>');
});


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

