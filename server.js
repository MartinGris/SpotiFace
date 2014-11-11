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
      host     : '$OPENSHIFT_MYSQL_DB_HOST:$OPENSHIFT_MYSQL_DB_PORT',
      user     : 'admin9zvwmFv',
      password : 'pNKjnPB_cvaB',
      database : 'chat',
    }
);

db.connect(function(err){
    if (err) console.log(err)
})

app.get('/', function(req, res){
    console.log('hello world');

	db.query('SELECT * FROM message', function(err, rows){
		if(err)
           console.log("Error Selecting : %s ",err );
		     
        console.log(rows);
		res.render('index',{data:rows});
	
	});

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

