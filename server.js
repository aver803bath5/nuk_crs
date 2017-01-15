const fs = require('fs');
const config = require('./config');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const pug = require('pug');
const port = process.env.PORT || 8080;
//const logger = require('morgan');
//const cors = require('cors');

//const logFile = fs.createWriteStream('/const/log/express/access.log');

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({extended: true}))
.use(bodyParser.json())
//.use(cors())
//.use(logger({stream: logFile}))

const server = app.listen(port, () => {
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
	const file = req.params.file;
	fs.stat('public/' + file, (err) => {
		if(!err){
			const f = fs.createReadStream('public/' + file);
			const contentType = 'text/plain';
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

.use('/public', express.static(__dirname + '/public'));