var express = require('express');
var app = express()
, http = require('http')
, server = http.Server(app)
, io = require('socket.io').listen(server);

// Listen on port 8081
server.listen(8081, function () {
	console.log('Listening on port 8081...');
});

// Send index.html on GET request
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});
// Send fontawesome font on GET request
app.get('/fonts/fontawesome-webfont.woff2', function (req, res) {
	res.sendFile(__dirname + '/fonts/fontawesome-webfont.woff2');
});
// Send fontawesome font on GET request
app.get('/fonts/fontawesome-webfont.woff', function (req, res) {
	res.sendFile(__dirname + '/fonts/fontawesome-webfont.woff');
});
// Send fontawesome font on GET request
app.get('/fonts/fontawesome-webfont.ttf', function (req, res) {
	res.sendFile(__dirname + '/fonts/fontawesome-webfont.ttf');
});
// Send font awesome css on GET request
app.get('/css/font-awesome.min.css', function (req, res) {
	res.sendFile(__dirname + '/css/font-awesome.min.css');
});
// Send chatstyles.css on GET request
app.get('/css/chatstyles.css', function (req, res) {
	res.sendFile(__dirname + '/css/chatstyles.css');
});
// Send stylesheet.css on GET request
app.get('/css/stylesheet.css', function (req, res) {
	res.sendFile(__dirname + '/css/stylesheet.css');
});
// Send jquery on GET request
app.get('/js/jquery-1.11.3.min.js', function (req, res) {
	res.sendFile(__dirname + '/js/jquery-1.11.3.min.js');
});
// Send socket.io-1.2.0.js on GET request
app.get('/socket.io.js', function (req, res) {
	res.sendFile(__dirname + '/node_modules/socket.io/node_modules/socket.io-client/socket.io.js');
});
// Send animations.js on GET request
app.get('/js/animations.js', function (req, res) {
	res.sendFile(__dirname + '/js/animations.js');
});
// Send chat.js on GET request
app.get('/js/chat.js', function (req, res) {
	res.sendFile(__dirname + '/js/chat.js');
});

// lists
var people_online = {};

io.sockets.on('connection', function (socket) {
	socket.on('adduser', function (username, userID) {
		// store username and userID in client socket session
		socket.username = username;
		socket.userID = userID;
		// set the default room to nothing
		socket.room = "";

		people_online[username] = userID;

		// update people_online for users
		io.sockets.emit('updaterooms', people_online, socket.room);

		// log a message on the server
		console.log(socket.username + ' with ID: ' + socket.userID + ' has joined.');
	});

	// push a new message to the client
	socket.on('sendchat', function(data) {
		data = removeTags(data);
		if (data != undefined && data.trim() != '')
		{
			io.sockets.in(socket.room).emit('updatechat', socket.username, socket.userID, data, getTimestamp());
		}
	});

	// switch client room
	socket.on('switchroom', function (newroom) {
		// leave current room
		socket.leave(socket.room);
		// join new room
		socket.join(newroom);

		/* NEW STUFF */
		socket.broadcast.emit('goToRoom', newroom);
		/* END NEW STUFF */

		// update client socket session info
		socket.room = newroom;
		socket.emit('updaterooms', people_online, socket.userID);
	});

	// disconnect user
	socket.on('disconnect', function () {
		// log a message to the server
		console.log(socket.username + ' with ID: ' + socket.userID + ' has disconnected.');

		// delete user from people_online
		delete people_online[socket.username];

		// update people_online for all sockets
		io.sockets.emit('updateusers', people_online);
		io.sockets.in(socket.room).emit('updatechat', 'SERVER', 0, socket.username + ' is nu offline.', getTimestamp());
		socket.leave(socket.room);
	});
});

function getTimestamp() {
	var date = new Date();

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	var min = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;
	var sec = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	return hour + ":" + min + ":" + sec;
};

var tagBody = '(?:[^"\'>]|"[^"]*"|\'[^\']*\')*';

var tagOrComment = new RegExp(
    '<(?:'
    // Comment body.
    + '!--(?:(?:-*[^->])*--+|-?)'
    // Special "raw text" elements whose content should be elided.
    + '|script\\b' + tagBody + '>[\\s\\S]*?</script\\s*'
    + '|style\\b' + tagBody + '>[\\s\\S]*?</style\\s*'
    // Regular name
    + '|/?[a-z]'
    + tagBody
    + ')>',
    'gi');

function removeTags(html) {
  var oldHtml;
  do {
    oldHtml = html;
    html = html.replace(tagOrComment, '');
  } while (html !== oldHtml);
  return html.replace(/</g, '&lt;');
};
