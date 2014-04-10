//Pong javascript engine created by Vinicius Vargas
var socket = io.connect("http://localhost:8080/");

var canvas = document.getElementById('pongtable');
var context = canvas.getContext('2d');

//global variables
var player1_y=200;
var player2_y=200;
var bar_width = 30;
var bar_heigth = 200;

var match_id;
var game_started = false;

var actual_player = 0;

var ball_y = 300
var ball_x = 500

var ballMoving = false;
var ball_radius = 10;

var player1_points = 0;
var player2_points = 0;

window.requestAnimFrame = (function(callback) {
	return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
		function(callback) {
			window.setTimeout(callback, 1000 / 60)
		}
})();

socket.on('ball_movement', function(data) {
	ball_y = data.ball_y;
	ball_x = data.ball_x;
});

socket.on('ball_moving', function(data) {
	ballMoving = data;
});

socket.on('game_started', function(data) {
	game_started = data;
});


socket.emit('match_request', {});
socket.on('match_response', function(match) {
	actual_player = match.player;
	console.log(actual_player);
	match_id = match.id;
	console.log(match_id);
});

function animate() {
	if (ballMoving == false) {
		ball_y = 300
		ball_x = 500

		ball_direction_y = 5;
		ball_direction_x = 5;
	}

	context.clearRect(0,0,canvas.width, canvas.height)
	//left bar
	context.beginPath()
	//rect(x, y, width, height)
	context.rect(10,player1_y,bar_width,bar_heigth)
	context.fillStyle='white'
	context.fill()

	context.rect(10+bar_width,0,1,600);
	context.rect(985,0,1,600);

	//right bar			
	//rect(x, y, width, height)
	context.rect(985,player2_y,bar_width,bar_heigth);
	context.fillStyle='white';
	context.fill();
	context.arc(ball_x,ball_y,ball_radius, 0, Math.PI * 2, true);
	context.fillStyle='white'
	context.fill()

	//send the player data to the server
	if (actual_player == 1) {
		socket.on('player2_server_movement', function(data) {
			player2_y = data;
		});
	} else if(actual_player == 2) {
		socket.on('player1_server_movement', function(data) {
			player1_y = data;
		});
	};
	

	requestAnimationFrame(function() {
		animate();
	})

	if(game_started == true) {
		var movement = {};
		movement.actual_player = actual_player;
		movement.id = match_id;
		socket.emit('movement_request', movement);
	}
		

}

//send the player data to the server
socket.on('player1_points', function(data) {
	player1_points = data;
	document.getElementById('p1points').innerHTML=player1_points;
});
	
socket.on('player2_points', function(data) {
	player2_points = data;
	document.getElementById('p2points').innerHTML=player2_points;
});

document.onkeydown = function(e) {
	
	//player 1 keys
	if(e.keyCode == 38 && actual_player == 1){
		if (player1_y < 10)
			player1_y = player1_y
		else 
			player1_y -= 5
	}
	else if(e.keyCode == 40 && actual_player == 1) {
		if (player1_y >= 390)
			player1_y = player1_y
		else
			player1_y += 5
	}

	//player 1 keys
	if(e.keyCode == 38 && actual_player == 2){
		if (player2_y < 10)
			player2_y = player2_y
		else 
			player2_y -= 5
	}
	else if(e.keyCode == 40 && actual_player == 2) {
		if (player2_y >= 390)
			player2_y = player2_y
		else
			player2_y += 5
	}

	if (actual_player == 1 && game_started == true) {
		console.log("p2");
		var movement = {};
		movement.player1_y = player1_y;
		movement.id = match_id;
		socket.emit('player1_client_movement', movement);
	} else if(actual_player == 2 && game_started == true) {
		console.log("p2");
		var movement = {};
		movement.player2_y = player2_y;
		movement.id = match_id;
		socket.emit('player2_client_movement', movement);
	};

	if (ballMoving == false && e.keyCode == 13) {
		console.log(ballMoving);
		socket.emit('game_start', match_id);
		game_started = true;
	}
}

//socket.emit('')
			
//window.setInterval(function() {}, 10);	
animate();