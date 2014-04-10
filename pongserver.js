var express = require('express');
var http = require('http');
var path = require('path');
var sio = require('socket.io');
var app = express();

////////////////////////
//Server configuration
////////////////////////
app.use(express.static(path.join(__dirname,'public')));
var server = http.createServer(app);
server.listen(8080);
var io = sio.listen(server);
io.set('log level', 1);

function Ball(){
	this.moving = false;
	this.speed = 10;
	this.y = 300;
	this.x = 500;
	this.y_direction = 5;
	this.x_direction = 5;
	this.radius = 10;	
};

function Match() {
	this.id;
	this.player1 = false;
	this.player2 = false;
	this.player1_y=200;
	this.player2_y=200;
	this.p1points=0;
	this.p2points=0;
	this.p1socketid;
	this.p2socketid;
	this.locked = false;
	this.ball = new Ball();
};

var matchesRunning = [];
var matchesWaitingPlayers = [];

var bar_width = 30;
var bar_heigth = 200;
var player1_points = 0;
var player2_points = 0;

var players = 0;
var critical_area = 35;

function initialFields(match) {
	match.ball.y = 300
	match.ball.x = 500
}

function ballMovement(match) {
	console.log("ready to move");
	if (match.ball.moving == true) {
		console.log("moving");
		match.ball.y += match.ball.y_direction;
		match.ball.x += match.ball.x_direction;
		
		if(match.ball.y < 5 || match.ball.y > 570) {
			match.ball.y_direction = match.ball.y_direction * -1
		}
			
		if(match.ball.x - match.ball.radius - 5 < critical_area) {
			if (match.ball.y + match.ball.radius < match.player1_y || match.ball.y - match.ball.radius > match.player1_y + bar_heigth) {
				addP2Point(match);
				initialFields(match);
				match.ball.moving = false;
			}
			else {
				match.ball.x_direction = match.ball.x_direction * -1;
			}
		}
		
		else if(match.ball.x + match.ball.radius + 5 > 1024 - critical_area) {
			if (match.ball.y + match.ball.radius < match.player2_y || match.ball.y - match.ball.radius > match.player2_y + match.bar_heigth) {
				addP1Point(match);
				initialFields(match);
				match.ball.moving = false;
			}
			else {
				match.ball.x_direction = match.ball.x_direction * -1;
			}
		}
	}
}
for (match in matchesRunning)
	setInterval(ballMovement(match), 10); 	

function addP1Point(match) {
	match.p1points++;
	io.sockets.on('connection', function(socket) {
		socket.emit('player1_points', match.p1points);
	});	
};

function addP2Point(match) {
	match.p2_points++;
	io.sockets.on('connection', function(socket) {
		socket.emit('player2_points', match.p2points);
	});
};

io.sockets.on('connection', function(socket) {
	setInterval(function() {
		socket.on('game_start', function(matchid) {
			for(var i = 0 ; i < matchesRunning.length ; i++) {
				if (matchesRunning[i].id == matchid)
					var actualMatch = matchesRunning[i];
			}			
			actualMatch.ball.moving = true;
			socket.emit('game_started', true);
			socket.emit('ball_moving', actualMatch.ball.moving);
			initialFields(actualMatch);
		});
	}, 1000);	
});

io.sockets.on('connection', function(socket) {
	socket.on('match_request', function(data) {
		var matchAndPlayer = match_request();
		socket.emit('match_response', matchAndPlayer);
	});
});

function match_request() {
	var i = 0;
	var matchAndPlayer = {};
	var length = matchesWaitingPlayers.length;
	//search for open matches
	if (length != 0) {
		while (i < length) {
			if (matchesWaitingPlayers[i].locked == false) {
				matchesWaitingPlayers[i].locked = true;
				if (matchesWaitingPlayers[i].player1 == false) {
					console.log("d1");
					matchesWaitingPlayers[i].player1 = true;
					matchAndPlayer.player = 1;
				}				
				else {
					console.log("d2");
					matchesWaitingPlayers[i].player2 = true;
					matchAndPlayer.player = 2;
				}				
				if (matchesWaitingPlayers[i].player1 == true && matchesWaitingPlayers[i].player2 == true) {
					console.log("e");
					matchAndPlayer.id = matchesWaitingPlayers[i].id;
					matchesWaitingPlayers[i].locked = false;
					matchesRunning.push(matchesWaitingPlayers[i]);
					delete matchesWaitingPlayers[i];
				}
			return matchAndPlayer;
			}
			i++;
		}
	}
	else {
		//got here, so there's no one matches running. let's create one!
		var match = new Match();
		match.player1 = true;
		
		matchesWaitingPlayers.push(match);
		var id = matchesWaitingPlayers.indexOf(match);
		matchesWaitingPlayers[id].id = id;
		console.log(matchesWaitingPlayers.length);
		matchAndPlayer.player = 1;
		matchAndPlayer.id = match.id;
		console.log("New match created. Id - " + match.id);

		return matchAndPlayer;
	}
}

io.sockets.on('connection', function(socket) {
		
		socket.on('player1_client_movement', function(data) {
				matchesRunning[data.id].player1_y = data.id.player1_y;
			});
		socket.on('player2_client_movement', function(data) {
				matchesRunning[data.id].player2_y = data.id.player2_y;
		});
		
		setInterval(function() {
			socket.on('movement_request', function(data) {

					if (data.id == matchesRunning[data.id]) {
						socket.emit('ball_movement', {
							'ball_y' : matchesRunning[i].ball.y,
							'ball_x' : matchesRunning[i].ball.x
						});
						socket.emit('ball_moving', matchesRunning[data.id].ball.moving);
						socket.emit('player1_server_movement', matchesRunning[data.id].player1_y);
						socket.emit('player2_server_movement', matchesRunning[data.id].player2_y);			
					}

			}, 10);
		});
			
/*
		setInterval(function() {
			socket.emit('player1_points', matchesRunning[i].p1points);
			socket.emit('player2_points', matchesRunning[i].p2points);
		}, 500);
		
*/	
});
