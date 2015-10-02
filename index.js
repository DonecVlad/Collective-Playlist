var express = require('express');
var app = express();
var morgan = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

app.enable('trust proxy');
app.use(morgan('short'));
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');

app.locals.pretty = true;

app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));
app.use('/js', express.static(__dirname + '/app/public/js'));
app.use('/files', express.static(__dirname + '/files'));
app.use(session({ secret: 'salt', cookie: { secure: true }, resave: true, saveUninitialized: true }));
app.use(cookieParser());

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

var server = app.listen(80);
var io = require('socket.io').listen(server);

require('./app/server/router')(app, io);