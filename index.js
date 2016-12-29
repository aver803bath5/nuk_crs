var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var pug = require('pug');
var port = process.env.PORT || 10150;
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
});