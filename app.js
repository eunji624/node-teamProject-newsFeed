require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const passportConfig = require('./passport');
// const authRouter = require('./routes/auth');
const session = require('express-session');

const PORT = process.env.PORT;
const app = express();
passportConfig();

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

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

app.use(
	session({
		resave: false,
		satisfies: false,
		secret: process.env.COOKIE_SECRET,
		cookie: {
			httpOnly: true,
			secure: false,
		},
	}),
);

app.use(passport.initialize()); //req에 passport설정 심음.
app.use(passport.session()); //req에 passport 정보 저장.

app.use('/api', [UsersRouter, PostsRouter, CommentsRouter]);

// app.get('/api/register', (req, res) => {
// 	res.render('register');
// });

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
