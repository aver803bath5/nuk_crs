const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const config = require('./config');

const app = express();
const mc = mongo.MongoClient;
const ObjectId = mongo.ObjectID;
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
	const sess = req.session;

	if(sess.username){
		res.render('index');
	}else{
		res.redirect('/login');
	}
})

.get('/login', (req, res) => {
	res.render('login');
})

.post('/login', (req, res) => {
	const data = req.body;
	const sess = req.session;

	db.collection('user').findOne({student_id: data.student_id}).toArray((err, usr) => {
		if(usr){
			if(usr.password === data.password){
				sess.student_id = usr.student_id;
				sess.username = usr.username;
				sess._id = usr._id;
				res.redirect('/');
			}else{
				res.redirct('/login#loginFailed');
			}
		}else{
			// 串 API 檢查帳號密碼，如果正確的話：
			sess.student_id = data.student_id;
			sess.password = data.password;
			res.redirect('/');
			// 如果失敗的話
			// res.redirect('/login#loginFailed');
		}
	});
})

.post('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
})

.get('/register', (req, res) => {
	// const data = req.body;
	// const sess = req.session;

	// if(sess.student_id && sess.password){
	res.render('register');
	// }else{
	//	res.redirect('/login');
	// }
})

.post('/register', (req, res) => {
	//const data = req.body;
	const sess = req.sess;

	if(sess.student_id && sess.password){
		db.collection('user').insertOne({

		});
	}
})

.get('/suggest', (req, res) => {
	const sess = req.session;

	if(sess.username){
		res.render('suggest', {
			name: sess.username,
		});
	}else{
		res.redirect('/login');
	}
})

.post('/suggest', (req, res) => {
	const data = req.body;
	const sess = req.session;

	if(sess.username){
		if(data.name && data.desc && data.teacher){
			db.collection('course').insert({
				name: data.name,
				desc: data.desc,
				stage: 1,
				creator: sess._id,
				create_time: new Date().setHours(0, 0, 0, 0),
				vote_time: null,
				petition_people: [],
				vote_people: [],
			});
			res.redirect('/petition');
		}else{
			res.redirect('/suggest#invalidData');
		}
	}else{
		res.redirect('/login');
	}
})

.get('/petition', (req, res) => {
	res.render('list', {
		verb: '連署',
	});
})

.post('/petition/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.username){
		db.collection('course').findOne({_id: new ObjectId(courseId)}).toArray((err, course) => {
			let hasPetited = false;
			for(let i=0;i<course.petition_people.length;i++){
				if(course.petition_people[i].user === sess._id) {
					hasPetited = true;
					break;
				}
			}
			if(hasPetited !== true){
				const newPetitionPeople = course.petition_people.push({
					time: new Date(),
					user: sess._id,
				});
				db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {petition_people: newPetitionPeople}});
				res.status(200).write(JSON.stringify({result: 0}));
				res.end();
			}else{
				res.status(400).write(JSON.stringify({result: -2}));
				res.end();
			}
		});
	}else{
		res.status(401).write(JSON.stringify({result: -1}));
		res.end();
	}
})

.get('/vote', (req, res) => {
	res.render('list', {
		verb: '投票',
	});
})

.post('/vote/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.username){
		db.collection('course').findOne({_id: new ObjectId(courseId)}).toArray((err, course) => {
			let hasPetited = false;
			for(let i=0;i<course.vote_people.length;i++){
				if(course.vote_people[i].user === sess._id) {
					hasPetited = true;
					break;
				}
			}
			if(hasPetited !== true){
				const newVotePeople = course.vote_people.push({
					time: new Date(),
					user: sess._id,
				});
				db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {vote_people: newVotePeople}});
				res.status(200).write(JSON.stringify({result: 0}));
				res.end();
			}else{
				res.status(400).write(JSON.stringify({result: -2}));
				res.end();
			}
		});
	}else{
		res.status(401).write(JSON.stringify({result: -1}));
	}
})

.use('/public', express.static(`${__dirname}/public`));

process.on('SIGINT', () => {
	/* eslint-disable no-console */
	console.log('Mongodb disconnected on app termination');
	/* eslint-enable no-console */
	db.close();
	process.exit();
});
