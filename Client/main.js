$(function() {
	console.log("hi");
});

socket = io.connect("http://sneakyleif.com:8081", {
	'reconnection': true,
	'reconnectionDelay': 500,
	'reconnectionAttempts': 'Infinity'
});