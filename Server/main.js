var io = require('socket.io')(8081);

io.on('connection', function(socket) {
	console.log("A user has connected!");
	
	socket.emit('initial-connection');
	
	socket.on('disconnect', function() {
		console.log("A user has disconnected!");
	});
});