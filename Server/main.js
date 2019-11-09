var io = require('socket.io')(8081),
	mysql = require('mysql'),
	colors = require('colors'),
	fs = require('fs'),
	bcrypt = require('bcrypt');

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
		
		var obj = createUObj(res[i]);
		uObj[res[i].id] = createUObj(res[i]); // create uObj object for user
		uIndex[res[i].username] = res[i].id; // create uIndex reference for user
	}
	
	log("Loaded "+ res.length +" users!"+ colors.green(" :D"));
	server.table.uObj = true;
});

// Create uObj for user (used when loading the users table and on registration)
function createUObj(res) {
	var obj = res;
	delete obj.id;

	obj.online = false;

	return obj;
}

// The big loading checker
loadCheck = setInterval(function() {
	if (server.db_conn && server.motd && server.test_motd && server.table.uObj) {
		log("done loading i think");
		
		server.status = "online";
		
		clearInterval(loadCheck);
	}
}, 100);

io.on('connection', function(socket) {
	log("A user has connected!");
	
	socket.emit('initial-connection'); // A "ping" of sorts
	
	socket.on('request-motd', function(n) {
		if (n == 0) {
			socket.emit('motd', server.motd);
		} else {
			socket.emit('motd', server.test_motd);
		}
	});
	
	// User Registration
	socket.on('submit-register', function(regData) {
		if (regData != "" && regData != null) {
			var email = {
				valid: false,
				tooLong: false,
				missing: false
			};
			var user = {
				valid: false,
				empty: false,
				taken: false,
				tooShort: false,
				tooLong: false,
				missing: false
			};
			var pass = {
				valid: false,
				empty: false,
				matches: false,
				tooShort: false,
				tooLong: false,
				missing: false,
				missing_confirmation: false
			};
			
			// Email
			if (regData.hasOwnProperty("email")) {
				if (regData.email == "") {
					email.valid = true;
					
				} else {
					if (regData.email.length <= 32) {
						email.valid = true;
						
					} else {
						email.tooLong = true;
						
					}
				}
			} else {
				email.missing = true;
			}
			
			// Username
			if (regData.hasOwnProperty("user")) {
				if (regData.user != "") {
					if (!isUserTaken(regData.user)) {
						if (regData.user.length >= 4) {
							if (regData.user.length <= 18) {
								user.valid = true;
							} else {
								user.tooLong = true;
							}
						} else {
							user.tooShort = true;
						}
					} else {
						user.taken = true;
					}
				} else {
					user.empty = true;
				}
			} else {
				user.missing = true;
			}
			
			// Password
			if (regData.hasOwnProperty("pass1")) {
				if (regData.hasOwnProperty("pass2")) {
					if (regData.pass1 != "") {
						if (regData.pass1.length >= 5) {
							if (regData.pass1.length <= 24) {
								pass.valid = true;
								
								if (regData.pass1 == regData.pass2) {
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
				} else {
					pass.missing_confirmation = true;
					
				}
			} else {
				pass.missing = true;
				
			}
			
			if (email.valid && user.valid && pass.valid && pass.matches) {
				console.log("someone tried to make an account with the username: \""+ regData.user +"\"");
				
				// CREATE ACCOUNT HERE!! (post to mysql, update uObj and uIndex, log user in)
				
				bcrypt.hash(regData.pass1, 10, function(err, hash) {
					var insert = {
						username: regData.user,
						email: regData.email,
						password: hash
					};

					con.query('INSERT INTO users SET ?', insert, function(err, res) {
						if (err) throw err;
						
						uObj[res.insertId] = createUObj(res);
						uIndex[res.username] = res[i].id;
						
						socket.pId = res.insertId;
						socket.join("p-"+ res.insertId);

						logIn(socket.pId);
					});
				});
				
			} else {
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
				for (var key in pass) {
					if (pass[key]) {
						err.pass = key;
					}
				}
				if (!pass.matches) {
					err.pass.matches = false;
				}
				
				socket.emit('register-response', err);
			}
		}
	});

	function logIn(id) {
		if (uObj.hasOwnProperty(id)) {
			uObj[id].online = true;
		} else {
			log("error logging in :(", "red");
		}
	}
	
	socket.on('disconnect', function() {
		if (socket.hasOwnProperty("pId")) {
			uObj[socket.pId].online = false;

			uObj[socket.pId].last_online = Date.now();
			var sql = "UPDATE users SET last_online = '"+ uObj[socket.pId].last_online +"' WHERE id ='"+ id +"'";
			con.query(sql, function(err, result) {if (err) throw err});

			log(uObj[socket.pId].username +" has gone offline :(", "gray");
		} else {
			log("A user has disconnected :(", "gray");
		}
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