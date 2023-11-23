require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const path = require('path');
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const UsersRouter = require('./routers/users.router.js');
const PostsRouter = require('./routers/posts.router.js');
const CommentsRouter = require('./routers/comment.router.js');

app.use('/api', UsersRouter);
app.use('/api', PostsRouter);
app.use('/api', CommentsRouter);

app.get('/', (req, res) => {
	res.render('main', { title: '팻' });
});
app.get('/api/register', (req, res) => {
	res.render('register');
});
app.get('/api/login', (req, res) => {
	res.render('login');
});

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
