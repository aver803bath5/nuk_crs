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

.use('/public', express.static(__dirname + '/public'));