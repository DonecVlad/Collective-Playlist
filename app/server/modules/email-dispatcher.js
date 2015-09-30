
var ES = require('./email-settings');
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({

	host 	    : ES.host,
	user 	    : ES.user,
	password    : ES.password,
	ssl		    : true

});

EM.dispatchResetPasswordLink = function(account, callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : account.email,
		subject      : 'Восстановление пароля',
		text         : 'something went wrong... :(',
		attachment   : EM.composeEmail(account)
	}, callback );
}

EM.composeEmail = function(o)
{
	var link = 'http://5.9.71.111:8080/reset-password?e='+o.email+'&p='+o.pass;
	var html = "<html><body>";
		html += "Здравствуйте "+o.name+",<br><br>";
		html += "Ваш логин :: <b>"+o.user+"</b><br><br>";
		html += "<a href='"+link+"'>Нажмите сюда чтобы восстановить ваш пароль</a><br><br>";
		html += "</body></html>";
	return  [{data:html, alternative:true}];
}