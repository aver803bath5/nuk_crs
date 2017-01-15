const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const config = require('./config');

const app = express();
const mc = mongo.MongoClient;
let db;

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({ extended: true }))
.use(bodyParser.json());

mc.connect(config.db.host, (err, database) => {
	/* eslint-disable no-console */
	if(!err){
		db = database;
		app.listen(process.env.PORT || config.port, () => {
			console.log('SERVER STARTED');
		});
	}else{
		console.error('Cannot connect to database.');
	}
	/* eslint-enable no-console */
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
		verb: '連署',
	});
})

.get('/vote', (req, res) => {
	res.render('list', {
		verb: '投票',
	});
})

.get('/register', (req, res) =>  {
	res.render('register', {
		
	});
})

.use('/public', express.static(`${__dirname}/public`));

process.on('SIGINT', () => {
	/* eslint-disable no-console */
	console.log('Mongodb disconnected on app termination');
	/* eslint-enable no-console */
	db.close();
	process.exit();
});
