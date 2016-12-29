var fs = require('fs');
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

.get('/login', (req, res) => {
	res.render('login');
})

.get('/suggest', (req, res) => {
	res.render('suggest');
})

.get('/petition', (req, res) => {
	res.render('list', {
		verb: '連署'
	})
})

.get('/vote', (req, res) => {
	res.render('list', {
		verb: '投票'
	})
})

.get('/public/:file', (req, res) => {
	var file = req.params.file;
	fs.stat('public/' + file, (err) => {
		if(!err){
			var f = fs.createReadStream('public/' + file);
			var contentType = 'text/plain';
			if(file.endsWith('.css')) contentType = 'text/css';
			if(file.endsWith('.js')) contentType = 'application/javascript';
			res.writeHead(200, { 'Content-Type': contentType });
			f.pipe(res);
		}else{
			res.writeHead(404, { 'Content-Type': 'text/plain'});
			res.write('File not found.');
			res.end();
		}
	});
})