const express = require('express');
const bodyParser = require('body-parser');
const mongo = require('mongodb');
const session = require('express-session');
const moment = require('moment');
const request = require('request');
const xml2json = require('xml2json');
// const nodemailer = require('nodemailer');
// const smtpTransport = require('nodemailer-smtp-transport');
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
	let isLogin = false;
	let isRoot = false;
	if(req.session.user){
		isLogin = true;
		if(req.session.user.is_root) isRoot = true;
	}
	db.collection('post').find({}).toArray((resp, docs) => {
		if(docs.length){
			const post = [];
			const stickyPost = [];
			let indexIntro = '';
			Object.keys(docs).forEach((i) => {
				const newDoc = docs[i];
				newDoc.date = moment(post.create_time).format('YYYY/MM/DD');
				if(newDoc.sticky){
					stickyPost.push(newDoc);
				}else{
					post.push(newDoc);
				}
				if(post[i].name === 'indexIntro') indexIntro = post[i].body;
			});
			res.render('index', {
				posts: stickyPost.reverse().concat(post.reverse()),
				indexIntro,
				isLogin,
				isRoot,
			});
		}else{
			res.render('index', {
				isLogin,
				isRoot,
			});
		}
	});
})

.get('/login', (req, res) => {
	res.render('login');
})

.post('/login', (req, res) => {
	const data = req.body;
	const sess = req.session;
	if(!data.student_id && data.password){
		res.redirect('/');
		return;
	}
	data.student_id = data.student_id.toLowerCase();
	db.collection('options').find({name: 'isOpen'}, (err, docs) => {
		let closed = false;
		if (docs){
			if(docs.isOpen === false) closed = true;
		}
		db.collection('user').find({student_id: data.student_id}).toArray((err3, usrs) => {
			if(usrs.length){
				const usr = usrs[0];
				if(usr.password === data.password){
					sess.user = {};
					sess.user.student_id = data.student_id;
					sess.user.username = usr.username;
					if(usr.is_root===true) sess.user.is_root = true;
					if(usr.is_root===true || !closed){
						if(req.query.next && req.query.next === 'admin'){
							res.redirect('/admin');
						}else{
							res.redirect('/');
						}
					}else{
						res.render('/closed');
					}
				}else{
					res.redirect('/login#loginFailed');
				}
			}else if(!closed){
				request.get({
					url: config.auth_page,
					qs: {
						id: 'Test0004',
						a: data.student_id,
						p: data.password,
					},
				}, (err2, resp, b) => {
					if(!err2 && b && JSON.parse(xml2json.toJson(b)).result==='Y'){
						sess.temp = {};
						sess.temp.student_id = data.student_id;
						sess.temp.password = data.password;
						res.redirect('/register');
					}else{
						res.redirect('/login#loginFailed');
					}
				});
			}else{
				res.render('/closed');
			}
		});
	});
})

.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
})

.post('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/login');
})

.get('/register', (req, res) => {
	const sess = req.session;

	if(sess.temp.student_id && sess.temp.password){
		res.render('register');
	}else{
		res.redirect('/login');
	}
})

.post('/register', (req, res) => {
	const data = req.body;
	const sess = req.session;

	if(sess.temp.student_id && sess.temp.password){
		if(data.username && data.email && data.phone && data.dept){
			db.collection('user').insert({
				student_id: sess.temp.student_id,
				password: sess.temp.password,
				username: data.username,
				email: data.email,
				phone: data.phone,
				dept: data.dept,
			});
			sess.user = sess.temp;
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

	if(sess.user){
		res.render('suggest', {
			name: sess.user.username,
			isLogin: true,
		});
	}else{
		res.redirect('/login');
	}
})

.post('/suggest', (req, res) => {
	const data = req.body;
	const sess = req.session;

	if(sess.user){
		if(data.name && data.desc && data.teacher){
			db.collection('course').insert({
				name: data.name,
				desc: data.desc,
				teacher: data.teacher,
				stage: 1,
				creator: sess.user,
				create_time: new Date().setHours(0, 0, 0, 0),
				vote_time: null,
				petition_people: [
					{
						time: new Date(),
						user: sess.user,
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

.delete('/suggest/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.user.is_root){
		db.collection('course').remove({_id: new ObjectId(courseId)}, (err) => {
			if(!err){
				res.status(200).write(JSON.stringify({result: 0}));
				res.end();
			}else{
				res.status(200).write(JSON.stringify({result: -2}));
				res.end();
			}
		});
	}else if(sess.user){
		res.status(200).write(JSON.stringify({result: -1}));
		res.end();
	}else{
		res.status(200).write(JSON.stringify({result: -3}));
		res.end();
	}
})

.get('/petition', (req, res) => {
	let isLogin = false;
	let isRoot = false;
	if(req.session.user){
		isLogin = true;
		if(req.session.user.is_root) isRoot = true;
	}
	db.collection('course').find({stage: {$in: [1, 2]}}).toArray((err, course) => {
		if(course.length){
			const newCourse = course.reverse();
			for(let i=0;i<course.length;i++){
				if((new Date()).getTime() - newCourse[i].create_time > 1000 * 86400 * 30 * 3){
					newCourse[i].old = true;
				}
				newCourse[i].end_time = moment(newCourse[i].create_time + (1000 * 86400 * 30 * 3)).format('YYYY/MM/DD');
				newCourse[i].create_time = moment(newCourse[i].create_time).format('YYYY/MM/DD');
				newCourse[i].didIVote = false;
				if(req.session.user){
					Object.keys(newCourse[i].petition_people).forEach((j) => {
						if(newCourse[i].petition_people[j].user.student_id === req.session.user.student_id){
							newCourse[i].didIVote = true;
						}
					});
				}
			}
			res.render('list', {
				verb: '連署',
				nextVerb: '投票',
				courses: newCourse,
				isLogin,
				isRoot,
			});
		}else{
			res.render('list', {
				verb: '連署',
				nextVerb: '投票',
				isLogin,
			});
		}
	});
})

.post('/vote/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.user){
		db.collection('course').find({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
			if(course.stage === 1){
				let hasPetited = false;
				if(course.petition_people.length){
					for(let i=0;i<course.petition_people.length;i++){
						if(course.petition_people[i].user.username === sess.user.username) {
							hasPetited = true;
							break;
						}
					}
				}
				if(hasPetited !== true){
					const newPetitionPeople = course.petition_people;
					newPetitionPeople.push({
						time: new Date(),
						user: sess.user,
					});
					if(course.petition_people.length === 5){
						db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {petition_people: newPetitionPeople, stage: 2}});
					}else{
						db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {petition_people: newPetitionPeople}});
					}
					res.status(200).write(JSON.stringify({result: 0}));
					res.end();
				}else{
					res.status(200).write(JSON.stringify({result: -2}));
					res.end();
				}
			}else{ // course.stage === 3
				let hasVote = false;
				if(course.petition_people.length){
					for(let i=0;i<course.vote_people.length;i++){
						if(course.vote_people[i].user.username === sess.user.username) {
							hasVote = true;
							break;
						}
					}
				}
				if(hasVote !== true){
					const newVotePeople = course.vote_people.push({
						time: new Date(),
						user: sess.user,
					});
					if(course.petition_people.length === 10){
						db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {vote_people: newVotePeople, stage: 4}});
					}else{
						db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {vote_people: newVotePeople}});
					}
					res.status(200).write(JSON.stringify({result: 0}));
					res.end();
				}else{
					res.status(200).write(JSON.stringify({result: -2}));
					res.end();
				}
			}
		});
	}else{
		res.status(200).write(JSON.stringify({result: -1}));
		res.end();
	}
})

.delete('/vote/:id', (req, res) => {
	const courseId = req.params.id;
	const sess = req.session;

	res.header('Content-Type', 'application/json');
	if(sess.user){
		db.collection('course').find({_id: new ObjectId(courseId)}).toArray((err, courses) => {
			const course = courses[0];
			if(course.stage === 1){
				let hasPetited = false;
				if(course.petition_people.length){
					for(let i=0;i<course.petition_people.length;i++){
						if(course.petition_people[i].user.username === sess.user.username) {
							course.petition_people.splice(i, 1);
							hasPetited = true;
							break;
						}
					}
				}
				if(hasPetited === false){
					res.status(200).write(JSON.stringify({result: -2}));
					res.end();
				}else{
					db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {petition_people: course.petition_people}});
					res.status(200).write(JSON.stringify({result: 0}));
					res.end();
				}
			}else{ // course.stage === 2
				let hasVoted = false;
				if(course.vote_people.length){
					for(let i=0;i<course.vote_people.length;i++){
						if(course.vote_people[i].user.username === sess.user.username) {
							course.vote_people.splice(i, 1);
							hasVoted = true;
							break;
						}
					}
				}
				if(hasVoted === false){
					res.status(200).write(JSON.stringify({result: -2}));
					res.end();
				}else{
					db.collection('course').update({_id: new ObjectId(courseId)}, {$set: {vote_people: course.vote_people}});
					res.status(200).write(JSON.stringify({result: 0}));
					res.end();
				}
			}
		});
	}else{
		res.status(401).write(JSON.stringify({result: -1}));
		res.end();
	}
})

.get('/vote', (req, res) => {
	let isLogin = false;
	let isRoot = false;
	if(req.session.user){
		isLogin = true;
		if(req.session.user.is_root) isRoot = true;
	}
	db.collection('course').find({stage: {$in: [3, 4]}}).toArray((err, course) => {
		if(course.length){
			const newCourse = course.reverse();
			for(let i=0;i<course.length;i++){
				if((new Date()).getTime() - newCourse[i].create_time > 1000 * 86400 * 30 * 3){
					newCourse[i].old = true;
				}
				newCourse[i].end_time = moment(newCourse[i].create_time + (1000 * 86400 * 30 * 3)).format('YYYY/MM/DD');
				newCourse[i].create_time = moment(newCourse[i].create_time).format('YYYY/MM/DD');
				newCourse[i].didIVote = false;
				if(req.session.user){
					Object.keys(newCourse[i].petition_people).forEach((j) => {
						if(newCourse[i].petition_people[j].user.student_id === req.session.user.student_id){
							newCourse[i].didIVote = true;
						}
					});
				}
			}
			res.render('list', {
				verb: '投票',
				nextVerb: '可以開課了',
				courses: newCourse,
				isLogin,
				isRoot,
			});
		}else{
			res.render('list', {
				verb: '投票',
				nextVerb: '可以開課了',
				isLogin,
			});
		}
	});
})

.get('/rule', (req, res) => {
	res.render('rules');
})

.get('/admin', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('options').find({name: 'option'}).toArray((err, opts) => {
			if(opts){
				const opt = opts[0];
				res.render('admin', {
					opt,
				});
			}else{
				res.render('admin');
			}
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.post('/admin/option', (req, res) => {
	const sess = req.session;
	const data = req.body;
	if(data.isOpen === 'on'){
		data.isOpen = true;
	}else{
		data.isOpen = false;
	}
	if(sess.user && sess.user.is_root){
		db.collection('options').find({name: 'option'}).toArray((err, docs) => {
			if(!err && docs.length){
				db.collection('options').update({name: 'option'}, {$set: data});
				res.redirect('/admin');
			}else if(!err){
				data.name = 'option';
				db.collection('options').insert(data);
				res.redirect('/admin');
			}else{
				res.redirect('/admin');
			}
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/admin/posts', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('post').find({}).toArray((resp, docs) => {
			if(docs.length){
				res.render('admin-post', {
					posts: docs.reverse(),
				});
			}else{
				res.render('admin-post');
			}
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/admin/newpost', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		res.render('admin-newpost', {
			post: '/admin/newpost',
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/admin/delpost/:id', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('post').find({_id: new ObjectId(req.params.id)}).toArray((resp, docs) => {
			if(docs){
				if(docs.length){
					db.collection('post').remove({_id: new ObjectId(req.params.id)});
				}
			}
			res.redirect('/admin/posts');
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.post('/admin/newpost', (req, res) => {
	const sess = req.session;
	const data = req.body;
	if(sess.user && sess.user.is_root){
		if(data.title && data.body){
			db.collection('post').insert({
				title: data.title,
				create_time: new Date().setHours(0, 0, 0, 0),
				body: data.body,
			});
		}
		res.redirect('/admin/posts');
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.post('/admin/newpost/:id', (req, res) => {
	const sess = req.session;
	const data = req.body;
	if(sess.user && sess.user.is_root){
		if(data.title && data.body){
			db.collection('post').update({ _id: new ObjectId(req.params.id) }, {
				$set: {
					title: data.title,
					body: data.body,
				},
			});
		}
		res.redirect('/admin/posts');
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/admin/newpost/:id', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('post').find({_id: new ObjectId(req.params.id)}).toArray((resp, docs) => {
			if(docs){
				const doc = docs[0];
				res.render('admin-newpost', {
					title: doc.title,
					content: encodeURIComponent(doc.body),
					id: req.params.id,
					post: `/admin/newpost/${req.params.id}`,
				});
			}else{
				res.redirect('/admin/posts');
			}
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/post/:id', (req, res) => {
	let isLogin = false;
	let isRoot = false;
	if(req.session.user){
		isLogin = true;
		if(req.session.user.is_root) isRoot = true;
	}
	db.collection('post').find({_id: new ObjectId(req.params.id)}).toArray((resp, docs) => {
		if(docs){
			const doc = docs[0];
			res.render('post', {
				title: doc.title,
				content: doc.body,
				date: moment(doc.create_time).format('YYYY/MM/DD'),
				isLogin,
				isRoot,
			});
		}else{
			res.redirect('/');
		}
	});
})

.get('/admin/post/sticky/:id', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('post').find({_id: new ObjectId(req.params.id)}).toArray((resp, docs) => {
			if(docs){
				const doc = docs[0];
				let sticky = false;
				if(!doc.sticky){
					sticky = true;
				}else{
					sticky = !doc.sticky;
				}
				db.collection('post').update({_id: new ObjectId(req.params.id)}, {
					$set: {
						sticky,
					},
				});
			}
			res.redirect('/admin/posts');
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.get('/admin/edit/intro', (req, res) => {
	const sess = req.session;
	if(sess.user && sess.user.is_root){
		db.collection('post').find({name: 'indexIntro'}).toArray((resp, docs) => {
			if(docs.length){
				const doc = docs[0];
				res.render('admin-newpost', {
					title: '🗿',
					content: encodeURIComponent(doc.body),
					id: req.params.id,
					post: '/admin/edit/intro',
				});
			}else{
				db.collection('post').insert({name: 'indexIntro', body: ''});
				res.render('admin-newpost', {
					title: '🗿',
					content: '',
					id: req.params.id,
					post: '/admin/edit/intro',
				});
			}
		});
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
	}
})

.post('/admin/edit/intro', (req, res) => {
	const sess = req.session;
	const data = req.body;
	if(sess.user && sess.user.is_root){
		if(data.body){
			db.collection('post').update({ name: 'indexIntro' }, {
				$set: {
					body: data.body,
				},
			});
		}
		res.redirect('/admin/');
	}else if(sess.user) {
		res.redirect('/');
	}else{
		res.redirect('/login?next=admin');
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

// function mail(mailto, subject, body, callback) {
// 	let transporter = nodemailer.createTransport(smtpTransport({
// 		host: 'mail.nuk.edu.tw',
// 		port: 25,
// 	}));

// 	transporter.sendMail({
// 		from: 'a1033312@nuk.edu.tw',
// 		to: mailto,
// 		subject: subject,
// 		html: body
// 	}, function(error, response) {
// 		if (error) {
// 			console.log(error);
// 		} else {
// 			callback();
// 		}
// 	});
// }
