$(document).ready(function(){

	var iSongs = [];
	var myPlayer;
	var cSong = [];
	
	var rPlayer = true;
	
	function seconds2time (seconds) {
		var hours   = Math.floor(seconds / 3600);
		var minutes = Math.floor((seconds - (hours * 3600)) / 60);
		var seconds = seconds - (hours * 3600) - (minutes * 60);
		var time = "";
	
		if (hours != 0) {
		  time = hours+":";
		}
		if (minutes != 0 || time !== "") {
		  minutes = (minutes < 10 && time !== "") ? "0"+minutes : String(minutes);
		  time += minutes+":";
		}
		if (time === "") {
			time = seconds;
		} else {
		  time += (seconds < 10) ? "0"+seconds : String(seconds);
		}
		return time;
	}
	
	var socket = io.connect('http://id6.ru');
	
	VK.init({ apiId: 4407258 });
	
	VK.Auth.getLoginStatus(authInfo);
	
	function authInfo(response) {
		if (response.session) {
			getSongs();
			getUser();
		} else {
			$('#login_button').css({'display': 'block', 'cursor':'pointer'});
		}
	}
	
	// Delete function
	socket.on('songCommand', function(data) {
		if(data.type == 'list') {
			var l = data.songsList.length;
			for(var e=0;e<l;e++){
				iSongs.push("" + data.songsList[e].sid + "");
			}
			getPlaylist();
		}
		if(data.type == 'add') {
			addToPlaylist(data.sid);
		}
		if(data.type == 'delete') {
			dSong(data.sid);
		}
	});
	
	// All Clients in room
	socket.on('roomclients', function(data) {
		var l = data.clients.length;
		for(var e=0;e<l;e++){
			$("ul#userlist").append("<li id=" + data.clients[e].id + ">" + data.clients[e].first_name + " " + data.clients[e].last_name + "</li>");
		}
	});
	
	// Online / Offline CLIENTS
	socket.on('presence', function(data) {
		console.log(data);
		if(data.state == 'online') {
			$("ul#userlist").append("<li id=" + data.client.id + ">" + data.client.first_name + " " + data.client.last_name + "</li>");
		} else {
			$("li#"+data.client.id).remove();
		}
	});
	
	// User Data
	socket.on('userData', function(data) {
		console.log(data);
		if(data.time){
			$(".points > .time").html(seconds2time(data.time));
		} else {
			$(".points > .time").css("background-color", "red");
		}
	});
	
	// Time Data
	socket.on('c_media', function(data) {	
		time = cSong.duration - data.time;
		if(data.status == 'play') {		
			if(time - 5 > cSong.time && time + 5 > cSong.time) {
				myPlayer.jPlayer('play', time);
				$(".poster").attr("id","pause");
			} else {
				myPlayer.jPlayer('play');
				$(".poster").attr("id","pause");
			}
		} else if(data.status == 'pause') {
			if(time - 5 > cSong.time && time + 5 > cSong.time) {
				myPlayer.jPlayer('pause', time);
				$(".poster").attr("id","play");
			} else {
				myPlayer.jPlayer('pause');
				$(".poster").attr("id","play");
			}
		}
	});
	
	socket.on('n_song', function(data) {
		sSong(data.mid);
		socket.emit('c_media', {});
	});
	
	/* Socket */
	
	// VK Stuff
	function afterLogin(response) {
		if (response.session) {
			getSongs();
			getUser();
		}
	}
	
	// GET USER INFO
	function getUser() {
		VK.Api.call("users.get", {fields:"photo_50"}, function(data) {
			socket.emit('fConnect', {type:'register', first_name:data.response[0].first_name, last_name:data.response[0].last_name, photo:data.response[0].photo_50, id:data.response[0].uid});
			$(".name").html(data.response[0].first_name + " " + data.response[0].last_name);
			$(".photo").css("background-image", "url("+data.response[0].photo_50+")");
		});
	}
	
	// GET SONGS
	function getSongs() {
		VK.Api.call("audio.get", {v:"5.0"}, function(data) {
			if (data) {
				//$('#login_button').css('display', 'none');
				var l = data.response.items.length;
				var sart = [];
				for(var e=0;e<l;e++){
					puSong("#songlist", data.response.items[e].owner_id, data.response.items[e].id, data.response.items[e].artist, data.response.items[e].title, data.response.items[e].duration, "addSong");	
				}
			}
		});
	}
	
	// GET SONG
	function addToPlaylist(id) {
		VK.Api.call("audio.getById", {v:"5.0", audios:id}, function(data) {
			if (data) {
				puSong("ul#songs", data.response[0].owner_id, data.response[0].id, data.response[0].artist, data.response[0].title, data.response[0].duration, "song");
			}
		});
	}
	
	// Push Song
	function puSong(w, o, i, a, t, d, id) {
		if(id == "song") {
			var $delete = "<span class='delete' id='" + o + "_" + i + "'>X</span>";
		} else {
			$delete = "";
		}
		
		$(w).append("<li class='" + id + "' id='" + o + "_" + i + "'><span class='artist'>" + a + "</span> &mdash; <span class='song'>" + t + "</span>" + $delete + "<span time='" + d + "' class='time'>" + seconds2time(d) + "</span></li>");
	}
	
	// GET PLAYLIST
	function getPlaylist() {
		VK.Api.call("audio.getById", {v:"5.0", audios:iSongs}, function(data) {
			if (iSongs.length) {
				var l = data.response.length;
				var sart = [];
				for(var e=0;e<l;e++){
					puSong("ul#songs", data.response[e].owner_id, data.response[e].id, data.response[e].artist, data.response[e].title, data.response[e].duration, "song");					
				}
				sSong(data.response[0].owner_id + "_" + data.response[0].id);
			}
		});
	}
	
	// Set Song
	function sSong(id) {
		VK.Api.call("audio.getById", {v:"5.0", audios:id}, function(data) {
			if (data) {
				artist = data.response[0].artist;
				title = data.response[0].title;
				
				myPlayer.jPlayer("setMedia", {
					mp3:data.response[0].url,
					artist:artist,
					title:title
				});
				
				myPlayer.jPlayer('play');
				
				$(".track > .title").html(title);
				$(".track > .artist").html(artist);
				
				lastfm.track.getInfo({artist:artist, track:title}, {success: function(data){
					if(data.track.album){
						$('.album').html(data.track.album.title);
						if(data.track.album.image[1]["#text"] == "http://cdn.last.fm/flatness/catalogue/noimage/2/default_album_medium.png"){
							$('.poster').css("background-color", "#b25283");
						} else {
							$('.poster').css("background-image", "url("+data.track.album.image[3]["#text"]+")");
						}
					} else {
						$('.poster').css("background-color", "#b25283");
					}
				}});
				dSong(id);
				socket.emit('c_media', {});
			}
		});
	}
	
	// Delete Song
	function dSong(id) {
		$("#" + id + ".song").eq(0).remove();
	}
	
	// Initialization player
	if(rPlayer == true) {
		myPlayer = $("#jquery_jplayer_1");
		var	myPlayerData,
		fixFlash_mp4, // Flag: The m4a and m4v Flash player gives some old currentTime values when changed.
		fixFlash_mp4_id, // Timeout ID used with fixFlash_mp4
		ignore_timeupdate, // Flag used with fixFlash_mp4
		iPost = 0,
		options = {
			ready: function (event) {
				// Determine if Flash is being used and the mp4 media type is supplied. BTW, Supplying both mp3 and mp4 is pointless.
				fixFlash_mp4 = event.jPlayer.flash.used && /m4a|m4v/.test(event.jPlayer.options.supplied);
			},
			timeupdate: function(event) {
				if (!ignore_timeupdate) {
					$(".bar").css("width",event.jPlayer.status.currentPercentAbsolute + "%");
					var $timeLeft = event.jPlayer.status.duration - event.jPlayer.status.currentTime;
					cSong.time = event.jPlayer.status.currentTime;
					cSong.duration = event.jPlayer.status.duration;
					cSong.paused = event.jPlayer.status.paused;
					$(".layer > .time").html(seconds2time(Math.round($timeLeft)));
				}
			},
			volumechange: function(event) {
				if(event.jPlayer.options.muted) {
					myControl.volume.slider("value", 0);
				} else {
					myControl.volume.slider("value", event.jPlayer.options.volume);
				}
			},
			swfPath: "/scp",
			supplied: "mp3",
			cssSelectorAncestor: "#jp_container_1",
			wmode: "window",
			keyEnabled: true
		},
		myControl = {
			volume: $(options.cssSelectorAncestor + " .jp-volume-slider")
		};
		
		// Instance jPlayer
		myPlayer.jPlayer(options);
	
		// A pointer to the jPlayer data object
		myPlayerData = myPlayer.data("jPlayer");
	
		// Define hover states of the buttons
		$('.jp-gui ul li').hover(
			function() { $(this).addClass('ui-state-hover'); },
			function() { $(this).removeClass('ui-state-hover'); }
		);
		
		myControl.volume.slider({
			animate: "fast",
			max: 1,
			range: "min",
			step: 0.01,
			value : $.jPlayer.prototype.options.volume,
			slide: function(event, ui) {
				myPlayer.jPlayer("option", "muted", false);
				myPlayer.jPlayer("option", "volume", ui.value);
			}
		});	

	}

	$("ul").on('click', '.addSong',function(e) {
		$data = $(this).attr('id');
		$artist = $(this).children("span.artist").html();
		$song = $(this).children("span.song").html();
		$dur = $(this).children("span.time").attr("time");
		socket.emit('message', {type:'addsong', sID:$data, artist:$artist, song:$song, duration:$dur});
	});
	
	var lastfm = new LastFM({
		apiKey	: '75b2164fbf069b64a9bf8318925686b2',
		apiSecret : 'fd2addc056b6ce5851a2ebd81ed7ffbc'
	});
	
	// Delete / Play / Payse
	$("body").on('click', '.delete', function() {
		var $id = $(this).attr('id');
		socket.emit('message', {type:'deleteSong', sID:$id});
	});
	
	$("body").on('click', '.poster#play', function() {
		socket.emit('c_media', {action:'play'});	
	});
	
	$("body").on('click', '.poster#pause', function() {
		socket.emit('c_media', {action:'pause'});	
	});
	
});