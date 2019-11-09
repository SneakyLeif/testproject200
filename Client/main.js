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
	var data = {
		user: $("#reg-username").val(),
		email: $("#email").val(),
		pass1: $("#reg-password").val(),
		pass2: $("#repeat-password").val(),
	};
	
	var email = {
		valid: false,
		tooLong: false
	};
	var user = {
		valid: false,
		empty: false,
		tooShort: false,
		tooLong: false
	};
	var pass = {
		valid: false,
		empty: false,
		matches: false,
		tooShort: false,
		tooLong: false
	};
	
	// Email
	if (data.email == "") {
		email.valid = true;
	} else {
		if (data.email.length <= 32) {
			email.valid = true;
		} else {
			email.tooLong = true;
		}
	}
	
	// Username
	if (data.user != "") {
		if (data.user.length >= 4) {
			if (data.user.length <= 18) {
				user.valid = true;
			} else {
				user.tooLong = true;
			}
		} else {
			user.tooShort = true;
		}
	} else {
		user.empty = true;
	}
	
	// Password
	if (data.pass1 != "") {
		if (data.pass1.length >= 5) {
			if (data.pass1.length <= 24) {
				if (data.pass1 == data.pass2) {
					pass.valid = true;
					pass.matches = true;
				}
			} else {
				pass.tooLong = true;
			}
		} else {
			pass.tooShort = true;
		}
	} else {
		pass.empty = true;
	}
	
	if (email.valid && user.valid && pass.valid && pass.matches) {
		console.log("yep");
		socket.emit('submit-register', data);
	} else {
		console.log("nope");
		var err = {
			err: true
		};
		for (var key in email) {
			if (email[key]) {
				err.email = key;
			}
		}
		for (var key in user) {
			if (user[key]) {
				err.user = key;
			}
		}
		console.log(pass);
		for (var key in pass) {
			if (pass[key]) {
				err.pass = key;
			}
		}
		if (!pass.matches) {
			if (!err.hasOwnProperty("pass")) {
				err.pass = "don't match";
				err.pass.matches = false;
			}
		}
		
		console.log(err);
	}
});

socket.on('register-response', function(data) {
	if (data.err) {
		console.log(data);
	}
});