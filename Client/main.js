// Initial variables
var connected = false;

// socket.io connection
var socket = io.connect("http://sneakyleif.com:8081", {
	'reconnection': true,
	'reconnectionDelay': 500,
	'reconnectionAttempts': 'Infinity'
});

// On initial connection
socket.on('initial-connection', function() {
	connected = true;
});

// On page load
$(function() {
	var loadingCheck = setInterval(function() {
		if (connected) {
			socket.emit("request-motd", 0);
			
			$("#main-menu-container").show();
			$("#title").show("blind", 250);
			setTimeout(function() {
				$("#player-type-container").show("blind", 500);
			}, 180);
			clearInterval(loadingCheck);
		}
	}, 100);
});

socket.on("motd", function(data) {
	$("#motd").html(data);
	$("#motd-title-container").show("blind", {"direction": "left"}, 500);
	setTimeout(function() {
		$("#motd").show("blind", {"direction": "up"}, 500);
	}, 500);
});

$(document).on("click", "#new", () => {
	$("#player-type-container").hide("blind", {
		"direction": "down"
	}, 250);
	$("#register-container").show("blind", 500);
});

$(document).on("click", "#old", () => {
	$("#player-type-container").hide("blind", {
		"direction": "down"
	}, 250);
	$("#login-container").show("blind", 500);
});

$(document).on("click", "#back", () => {
	setTimeout(function() {
		$("#player-type-container").show("blind", {
			"direction": "down"
		}, 250);
	}, 250);
	$("#login-container").hide("blind", 500);
	$("#register-container").hide("blind", 500);
});

$(document).on("click", "#register", () => {
	data = {
		user: $("#reg-username").val(),
		email: $("#email").val(),
		pass1: $("#reg-password").val(),
		pass2: $("#repeat-password").val(),
	};
	
	userValid = false;
	passValid = false;
	passMatches = false;
	
	if (data.user != "") {
		if (data.user.length > 4 && data.user.length <= 18) {
			userValid = true;
		}
	}
	
	if (data.pass1 != "") {
		if (data.pass1.length > 4 && data.pass1.length <= 24) {
			passValid = true;
			
			if (data.pass1 == data.pass2) {
				passMatches = true;
			}
		}
	}
	
	if (userValid && passValid && passMatches) {
		console.log("yep");
		console.log(data);
		socket.emit('submit-register', data);
	} else {
		console.log("nope");
		console.log(data);
	}
});