var AM = require('./modules/main-db');

var currentTime = 0;
var timeout, interval;

module.exports = function(app, io) {
	app.get('/', function(req, res) {
		res.render('index', {title : 'Главная', udata : req.session.user});
	});
	
	app.get('/signup', function(req, res) {
		res.render('signup', {title : 'Регистрация', udata : req.session.user});
	});	
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
	
	app.post('/invite', function(req, res) {
		AM.iNvite(req.param('code'), req.param('email'), function(e, o){
			if(!o){
				res.send(e, 400);
			} else {
				res.send(o, 200);
			}
		});
	});
	
	var chatClients = new Object();
	var currentSong = 0;
	var songs = [];
	
	
	var clients = [];
	
	
	io.on('connection', function (socket) {
		socket.on('connect', function(data){
			login(socket, data);
		});
		
		socket.on('chatmessage', function(data){
			chatmessage(socket, data);
		});
		
		socket.on('message', function(data){
			roomController(socket, data);
		});
		
		socket.on('c_media', function(data){
			c_media(socket, data);
		});
		
		socket.on('subscribe', function(data){
			subscribe(socket, data);
		});
		
		socket.on('unsubscribe', function(data){
			unsubscribe(socket, data);
		});
		
		socket.on('disconnect', function(){
			disconnect(socket);
		});
	});
	
	// create a client for the socket
	function login(socket, data){
		if(data.type == 'register') {
			var tID = generateId();
			AM.checkOrRegisterUser({vkID:data.id, first_name:data.first_name, last_name:data.last_name, photo:data.photo, clientId:tID}, function(e, o){
				if(e) {
					clients.push({ user:e.user, id:e.clientId, socket:socket.id, pID:pID, pos:{x:0, y:0}});
					socket.emit('userData', { time:e.time });
					data.clientId = e.clientId;
				} else {
					socket.emit('userData', { time:600 });
					data.clientId = tID;
				}
			});
		}
	}
	
	function disconnect(socket){
		for(var i = 0; i < clients.length; i++){
			if(socket[i].socket == socket.id){
				socket = _.without(socket, socket[i]);
				console.log("User disconnect:", socket.id);
			}
		}
	}
	
	function roomController(socket, data){
		if(data.type == 'getsongs') {
			socket.emit('songCommand', { type: 'list', songsList:songs });
		}
		
		if(data.type == 'addsong') {
			points(0, chatClients[socket.id].clientId, data.duration, function(e) {
				if(e){
					songs.push({sid:data.sID, name:data.name, duration:data.duration});
					socket.broadcast.to(data.room).emit('songCommand', { type:'add', client:chatClients[socket.id], sid:data.sID, name:data.name, duration:data.duration });
					socket.emit('songCommand', { type:'add', client: chatClients[socket.id], sid:data.sID, name:data.name, duration:data.duration });
					c_media(socket, data);
					if(currentSong == 0){
						nSong(socket, data);
						currentSong = 1;
					}
				}
				socket.emit('userData', { time:e });
			});
		}
			
		if(data.type == 'deleteSong') {
			for(var i=0; i<songs.length; i++) {
				if(songs[i].sid == data.sID) {
					songs.splice(i, 1);
					break;
				}
			}
			socket.emit('songCommand', { type:'delete', sid:data.sID });
			socket.broadcast.to(data.room).emit('songCommand', { type:'delete', sid:data.sID });
		}
		
	}
	
	var conRoom = [];
		conRoom.status = 'stop';
				
	// Function to control media
	var USinterval;
	var tAmer;
	
	function c_media(socket, data) {
	
		if(conRoom.status == 'stop' && io.sockets.manager.rooms['/' + room] && io.sockets.manager.rooms['/' + room].length > 0 && songs.length > 0) {
			tAmer = new timer(function() {}, songs[0].duration*1000);
			conRoom.status = 'play';
		}
		
		if(data.action == 'play') {
			tAmer.start();
			conRoom.status = 'play';	
		}
		
		if(data.action == 'pause') {
			tAmer.pause();
			conRoom.status = 'pause';
		}
		
		if(tAmer) {
			clearInterval(USinterval);
			USinterval = setInterval(function() {
				console.log(tAmer.getTimeLeft());
				
				if(tAmer.getTimeLeft() <= 1) {
					console.log("Play next song");
					nSong(socket, data, "end");
					clearInterval(USinterval);
				}
				
				sendMC(socket, data);
			}, 1000);
		}
	}
	
	function sendMC(socket, data){
		socket.broadcast.to(data.room).emit('c_media', { time: tAmer.getTimeLeft(), status:conRoom.status });
		socket.emit('c_media', { time:tAmer.getTimeLeft(), status:conRoom.status });
	}
	
	function nSong(socket, data, status) {
		if(status == "end") {
			songs.shift();
			conRoom.status = 'stop';
		}
		if(songs.length > 0) {
			socket.broadcast.to(data.room).emit('n_song', { mid:songs[0].sid });		
			socket.emit('n_song', { mid:songs[0].sid });
		} else {
			currentSong = 0;
		}
	}
	
	// subscribe a client to a room
	function subscribe(socket, data){
		// get a list of all active rooms
		var rooms = getRooms();
		
		// check if this room is exist, if not, update all 
		// other clients about this new room
		if(rooms.indexOf('/' + data.room) < 0){
			socket.broadcast.emit('addroom', { room: data.room });
		}
		
		// subscribe the client to the room
		socket.join(data.room);
		
		// update all other clients about the online
		// presence
		updatePresence(data.room, socket, 'online');
		
		socketId = socket.id;
		room = data.room;
			
		// send to the client a list of all subscribed clients
		// in this room	
		
		socket.emit('roomclients', { room: data.room, clients: getClientsInRoom(socket.id, room) });
		socket.emit('songCommand', { type: 'list', songsList:songs });	
	}
	
	// unsubscribe a client from a room, this can be
	// occured when a client disconnected from the server
	// or he subscribed to another room
	function unsubscribe(socket, data){
		// update all other clients about the offline
		// presence
			
		updatePresence(data.room, socket, 'offline');
		
		// remove the client from socket.io room
		socket.leave(data.room);
		
		// if this client was the only one in that room
		// we are updating all clients about that the
		// room is destroyed
		if(!countClientsInRoom(data.room)){
			// with 'io.sockets' we can contact all the
			// clients that connected to the server
			io.sockets.emit('removeroom', { room: data.room });
		}
	}
	
	// 'io.sockets.manager.rooms' is an object that holds
	// the active room names as a key, returning array of
	// room names
	function getRooms(){
		return Object.keys(io.sockets.manager.rooms);
	}
	
	// get array of clients in a room
	function getClientsInRoom(socketId, room){
		// get array of socket ids in this room
		var socketIds = io.sockets.manager.rooms['/' + room];
		var clients0 = [];
		
		if(socketIds && socketIds.length > 0){
			socketsCount = socketIds.lenght;
			
			// push every client to the result array
			for(var i = 0, len = socketIds.length; i < len; i++) {
				
				// check if the socket is not the requesting
				// socket
				if(socketIds[i] != socketId) {
					clients0.push(chatClients[socketIds[i]]);
				}
			}
		}
		
		return clients0;
	}
	
	// get the amount of clients in aroom
	function countClientsInRoom(room){
		// 'io.sockets.manager.rooms' is an object that holds
		// the active room names as a key and an array of
		// all subscribed client socket ids
		if(io.sockets.manager.rooms['/' + room]){
			return io.sockets.manager.rooms['/' + room].length;
		}
		return 0;
	}
	
	// updating all other clients when a client goes
	// online or offline. 
	function updatePresence(room, socket, state){
		// socket.io may add a trailing '/' to the
		// room name so we are clearing it
		room = room.replace('/','');
		
		// by using 'socket.broadcast' we can send/emit
		// a message/event to all other clients except
		// the sender himself
		socket.broadcast.to(room).emit('presence', { client:chatClients[socket.id], state:state, room:room });
	}
	
	// Some Functions
	// unique id generator
	function generateId(){
		var S4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		//return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
		return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());//Be easy
	}
	
	//Type (Plus, Minus)
	function points(type, clientId, points, callback) {
		// 1 LIKE = 200sec
		
		// Every song Duration / 3
		
		// Song duration == points
		AM.points({type:type, clientId:clientId, points:points}, function(e){		
			if(e) {
				callback(e);
			} else {
				callback(null);	
			}
		});
	}
	
	function timer(callback, delay) {
		var id, started, remaining = delay, running;
		
		this.start = function() {
			running = true;
			started = new Date();
			id = setTimeout(callback, remaining);
		}
		
		this.pause = function() {
			running = false;
			clearTimeout(id);
			remaining -= new Date() - started;
		}
		
		this.getTimeLeft = function() {
			if (running) {
				this.pause();
				this.start();
			}
			return Math.ceil(remaining/1000);
		}
		
		this.getStateRunning = function() {
			return Math.ceil(running/1000);
		}
		
		this.start();
	}
}