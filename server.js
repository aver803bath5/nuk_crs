const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const session = require('express-session');
const config = require('./config');

const app = express();
const mc = mongo.MongoClient;
const ObjectId = mongo.ObjectID;
let db;

app
.set('view engine', 'pug')
.use(bodyParser.urlencoded({ extended: true }))
.use(bodyParser.json())
.use(session({
	secret: config.secret.session,
	cookie: { maxAge: 100 * 60 * 1000 },
	resave: false,
	saveUninitialized: true,
}));

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

	db.collection('user').find({student_id: data.student_id}).toArray((err, usrs) => {
		if(usrs.length){
			const usr = usrs[0];
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
	const sess = req.session;

	if(sess.student_id && sess.password){
		res.render('register');
	}else{
		res.redirect('/login');
	}
})

.post('/register', (req, res) => {
	const data = req.body;
	const sess = req.sess;

	if(sess.student_id && sess.password){
		if(data.username && data.email && data.phone && data.dept){
			db.collection('user').insert({
				student_id: sess.student_id,
				password: sess.password,
				username: data.username,
				email: data.email,
				phone: data.phone,
				dept: data.dept,
			});
			res.redirect('/');
		}else{
			res.redirect('/register#invalidData');
		}
	}else{
		res.redirect('/login');
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
				petition_people: [
					{
						time: new Date(),
						user: sess._id,
					},
				],
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
		db.collection('course').find({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
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

.delete('/petition/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.username){
		db.collection('course').find({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
			let hasPetited = false;
			for(let i=0;i<course.petition_people.length;i++){
				if(course.petition_people[i].user === sess._id) {
					delete course.petition_people[i];
					hasPetited = true;
					break;
				}
			}
			if(hasPetited === false){
				res.status(400).write(JSON.stringify({result: -2}));
				res.end();
			}else{
				db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {petition_people: course.petition_people}});
				res.status(200).write(JSON.stringify({result: 0}));
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
		db.collection('course').findOne({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
			let hasVoted = false;
			for(let i=0;i<course.vote_people.length;i++){
				if(course.vote_people[i].user === sess._id) {
					hasVoted = true;
					break;
				}
			}
			if(hasVoted !== true){
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

.delete('/vote/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.username){
		db.collection('course').find({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
			let hasVoted = false;
			for(let i=0;i<course.vote_people.length;i++){
				if(course.vote_people[i].user === sess._id) {
					delete course.vote_people[i];
					hasVoted = true;
					break;
				}
			}
			if(hasVoted === false){
				res.status(400).write(JSON.stringify({result: -2}));
				res.end();
			}else{
				db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {vote_people: course.vote_people}});
				res.status(200).write(JSON.stringify({result: 0}));
				res.end();
			}
		});
	}else{
		res.status(401).write(JSON.stringify({result: -1}));
		res.end();
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
