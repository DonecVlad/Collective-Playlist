(function (d, w, c) { (w[c] = w[c] || []).push(function() { try { w.yaCounter25555043 = new Ya.Metrika({id:25555043, webvisor:true, clickmap:true, trackLinks:true, accurateTrackBounce:true}); } catch(e) { } }); var n = d.getElementsByTagName("script")[0], s = d.createElement("script"), f = function () { n.parentNode.insertBefore(s, n); }; s.type = "text/javascript"; s.async = true; s.src = (d.location.protocol == "https:" ? "https:" : "http:") + "//mc.yandex.ru/metrika/watch.js"; if (w.opera == "[object Opera]") { d.addEventListener("DOMContentLoaded", f, false); } else { f(); } })(document, window, "yandex_metrika_callbacks");
new Image().src = "//counter.yadro.ru/hit?r" + escape(document.referrer) + ((typeof(screen)=="undefined")?"" : ";s"+screen.width+"*"+screen.height+"*" + (screen.colorDepth?screen.colorDepth:screen.pixelDepth)) + ";u"+escape(document.URL) + ";h"+escape(document.title.substring(0,80)) + ";" +Math.random();
$(document).ready(function(){	
	var n = 1;
	var videos = [
		["/videos/1.png", "/videos/1.mp4", "/videos/1.webm"],
		["/videos/2.png", "/videos/2.mp4", "/videos/2.webm"],
		["/videos/3.png", "/videos/3.mp4", "/videos/3.webm"]
	];
	
	$(".mute > .sub").click( function (){
		if( $("video").prop('muted') ) {
			$("video").prop('muted', false);
			$(this).css("background-image","url('/img/unmute.png')");
		} else {
			$("video").prop('muted', true);
			$(this).css("background-image","url('/img/mute.png')");
		}
	});
	
	$("video").on("ended", function (e) {
		if (n >= videos.length) n = 0;
		$("#mp4, #webm").attr("poster", videos[n][0]);		
		$("#mp4").attr("src", videos[n][1]);
		$("#webm").attr("src", videos[n][2]);
		$("video").get(0).load();
		$("video").get(0).play();
		n++;
	});
	
	$("body").on('click', '.enter#show', function() {
		$(this).attr('id','hide');
		$(".fields").css("display", "block");
	});
	
	$("body").on('click', '.enter#hide', function() {
		$(".fields").css("display", "none");
		$(this).attr('id','show');
	});
	
	$("body").on('click', '.send', function() {
	    var $code = $("input#code").val();
	    var $email = $("input#email").val();
	    if(!$email) {
			$(".fields").append("<div class='error'>Вы не ввели адрес почты.</div>");
		} else if(!$code) {
			$(".fields").append("<div class='error'>Вы не ввели код.</div>");
		} else {
			var posting = $.post("invite", {code:$code, email:$email});
			posting.success(function(responseText, status){
				console.log(responseText);
				$(".fields").html("<div class='perfect'>Код успешно использован, в начале бета-тестирования на ваш почтовый ящик придёт уведомление.</div>");
			}),
			posting.error(function(e) {
				$(".fields").append("<div class='error'>Код указан неверно или уже был использован.</div>");
			});
		}
	});	
	
});