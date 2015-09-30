var AM = require('./modules/main-db');

module.exports = function(app) {

	app.get('/', function(req, res) {
		res.render('index', {title : 'Главная', udata : req.session.user});
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
};