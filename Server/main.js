var io = require('socket.io')(8081),
	mysql = require('mysql'),
	colors = require('colors'),
	fs = require('fs');

// Initial variables
var server = {
	test_motd: "",
	motd: "",
	status: "starting",
	db_conn: false,
	table: {
		users: false
	} // turns true when done loading mysql table
};

// Loading server info
fs.readFile('motd.txt', 'utf8', function(err, data) {
	if (err) throw err;
	log("motd loaded!" + colors.green(" :D"));
	server.motd = data;
});
fs.readFile('test_motd.txt', 'utf8', function(err, data) {
	if (err) throw err;
	log("test_motd loaded!" + colors.green(" :D"));
	server.test_motd = data;
});

// Main game variables
var uArr = []; // List of all online users
var uObj = {}; // Stores user data
var uIndex = {}; // Index of all users to get ID from username

// MySQL Config
var config = {
	host: "localhost",
	user: "node",
	password: "node",
	database: "game"
};

// Handling MySQL disconnects
var con;
function handleDisconnect() {
	con = mysql.createConnection(config);
	
	// Connecting to the database
	con.connect(function(err) {
		if (err) {
			log(colors.yellow("Error connecting to database.") + colors.red(" :("));
			setTimeout(handleDisconnect, 2000);
		} else {
			log(colors.yellow("Connected to database!") + colors.green(" :D"));
			server.db_conn = true;
		}
	});
	
	// Reconnect on connection lost
	con.on("error", function(err) {
		log("Database "+ err, "red");
		if (err.code === "PROTOCOL_CONNECTION_LOST") {
			handleDisconnect();
		} else {
			throw err;
		}
	});
}

handleDisconnect(); // Connect and start disconnect handler

// Preloading SQL database into objects
// Loading users
con.query("SELECT * FROM users", function(err, res) {
	if (err) throw err;
	
	for (var i = 0; i < res.length; i++) {
		uObj[res[i].id] = res[i]; // create uObj object for user
		uIndex[res[i].username] = res[i].id; // create uIndex reference for user
	}
	
	log("Loaded "+ res.length +" users!"+ colors.green(" :D"));
	server.table.uObj = true;
});

// The big loading checker
loadCheck = setInterval(function() {
	if (server.db_conn && server.motd && server.test_motd && server.table.uObj) {
		log("done loading i think");
		
		server.status = "online";
		
		clearInterval(loadCheck);
	}
}, 100);

io.on('connection', function(socket) {
	console.log("A user has connected!");
	
	socket.emit('initial-connection');
	
	socket.on('request-motd', function(n) {
		if (n == 0) {
			socket.emit('motd', server.motd);
		} else {
			socket.emit('motd', server.test_motd);
		}
	});
	
	socket.on('submit-register', function(regData) {
		userValid = false;
		passValid = false;
		passMatches = false;
		
		if (regData.user != "") {
			userTaken = isUserTaken(regData.user);
			
			if (!userTaken && regData.user.length > 4 && regData.user.length <= 18) {
				userValid = true;
			}
		}
		
		if (regData.pass1 != "") {
			if (regData.pass1.length > 4 && regData.pass1.length <= 24) {
				passValid = true;
				
				if (regData.pass1 == regData.pass2) {
					passMatches = true;
				}
			}
		}
		
		if (userValid && passValid && passMatches) {
			// CREATE ACCOUNT HERE!! (post to mysql, update uObj and uIndex, log user in)
			
			console.log("someone tried to make an account with the username: \""+ regData.user +"\"");
		} else {
			console.log("nope");
			console.log(regData);
		}
	});
	
	socket.on('disconnect', function() {
		console.log("A user has disconnected!");
	});
});

function isUserTaken(user) {
	taken = false;
	
	for (var i = 0; i < uObj.length; i++) {
		if (user == uObj[i].username) {
			taken = true;
			break;
		}
	}
	
	return taken
}

// Formatted console log function
function log(text, color) {
	var d = new Date();
	var h = d.getHours();
	var m = d.getMinutes();
	var ap = "AM";
	if (h > 12) {
		h -= 12;
		var ap = "PM";
	}
	if (m < 10) {
		m = "0" + m;
	}
	time = h + ":" + m + " " + ap;
	
	if (typeof(color) == "undefined") {
		display = colors.grey(time) + ": " + text;
		console.log(display);
	} else {
		console.log(colors.grey(time) + ": " + colors[color](text));
	}
}

// Catching ctrl+c
process.on('SIGINT', exitHandler.bind(null, {exit: true, type: "shutdown"}));

// Graceful shutdown
function exitHandler(options, err) {
	if (options.exit) {
		process.exit();
	}
}