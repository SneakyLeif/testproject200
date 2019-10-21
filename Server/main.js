var io = require('socket.io')(8081);
var fs = require('fs');

// Initial Variables
var server = {
	test_motd: "default af test motd",
	motd: "default af motd",
	status: "starting"
};

// Loading server info
fs.readFile('motd.txt', 'utf8', function(err, data) {
	if (err) throw err;
	console.log(data);
	server.motd = data;
});
fs.readFile('test_motd.txt', 'utf8', function(err, data) {
	if (err) throw err;
	server.test_motd = data;
});


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
	
	socket.on('disconnect', function() {
		console.log("A user has disconnected!");
	});
});

// Catching ctrl+c
process.on('SIGINT', exitHandler.bind(null, {exit: true, type: "shutdown"}));

// Graceful shutdown
function exitHandler(options, err) {
	if (options.exit) {
		process.exit();
	}
}