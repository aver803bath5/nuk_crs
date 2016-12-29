var config = require('./config');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pug = require('pug');
var port = process.env.PORT || 8080;
//var logger = require('morgan');
//var cors = require('cors');

//var logFile = fs.createWriteStream('/var/log/express/access.log');

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
//.use(cors())
//.use(logger({stream: logFile}))

var server = app.listen(port, () => {
	console.log("SERVER STARTED");
});

app
.get('/', (req, res) => {
	res.render('index');
})

.get('/public/:file', (req, res) => {
	var file = req.params.file;
	var f = fs.createReadStream('public/' + file);
	var contentType = 'text/plain';
	if(file.endsWith('.css')) contentType = 'text/css';
	if(file.endsWith('.js')) contentType = 'application/javascript';
	res.writeHead(200, { 'Content-Type': contentType });
	f.pipe(res);
})