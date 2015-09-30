var crypto 		= require('crypto');
var MongoDB 	= require('mongodb').Db;
var Server 		= require('mongodb').Server;

var dbPort 		= 27017;
var dbHost 		= 'localhost';
var dbName 		= 'multiMusic';

var db = new MongoDB(dbName, new Server(dbHost, dbPort, {auto_reconnect: true}), {w: 1});
	db.open(function(e, d){
	if (e) {
		console.log(e);
	}	else{
		console.log('connected to database :: ' + dbName);
	}
});

var users = db.collection('users');
var beta = db.collection('beta');
var artists = db.collection('artists');
var songs = db.collection('songs');


exports.checkOrRegisterUser = function(newData, callback)
{
	var checkedData = {};
	checkedData.vkID = newData.vkID;
	checkedData.first_name = newData.first_name;
	checkedData.last_name = newData.last_name;
	checkedData.photo = newData.photo;
	checkedData.clientId = newData.clientId;
	
	users.findOne({vkID:checkedData.vkID}, function(e, o) {
		if (o) {
			callback(o);
		} else {
			checkedData.time = 600;
			users.insert(checkedData, {safe: true}, callback);
		}
	});
}

//SID
//NAME
//ARTIST
//ALBUM

// ADD NEW ARTIST OR GET EXIST
exports.gArtist = function(sData, callback)
{
	artists.findOne({name:sData.artist}, function(e, o) {
		if (o) {
			callback(o);
		} else {
			artists.insert(sData, {safe: true}, callback);
		}
	});
}

// ADD NEW SONG OR GET EXIST
exports.gSong = function(sData, callback)
{
	songs.findOne({name:sData.song}, function(e, o) {
		if (o) {
			callback(o);
		} else {
			songs.insert(sData, {safe: true}, callback);
		}
	});
}

exports.points = function(newData, callback)
{
	var points = 0, price = 0;
	users.findOne({clientId:newData.clientId}, function(e, o){
		points = o.time;
		price = newData.points;
		
		if(points >= price) {
			points = points - price;
			o.time = points;		
			users.save(o, {safe: true}, function(err) {
				callback(o.time);
			});
		} else {
			callback(null);
		}
	});
}

exports.iNvite = function(code, email, callback)
{
	beta.findOne({code:code}, function(e, o){
		if (o == null){
			beta.insert({code:code, email:email}, {safe: true}, callback);
		} else {
			callback('exist');			
		}
	});
}