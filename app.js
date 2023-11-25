require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const path = require('path');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/public`));

const UsersRouter = require('./routers/users.router.js');
const PostsRouter = require('./routers/posts.router.js');
const CommentsRouter = require('./routers/comment.router.js');

app.use('/api', [UsersRouter, PostsRouter, CommentsRouter]);

// app.get('/api/register', (req, res) => {
// 	res.render('register');
// });

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
