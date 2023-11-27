require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const kakaoStrategy = require('passport-kakao').Strategy;

const passportConfig = require('./passport');
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

const authRouter = require('./routers/auth.js');
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

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (user, done) {
	done(null, authData);
});

//사용자가 전송한 데이터를 어떻게 처리할것인가?
app.post(
	'/auth/login_process',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/auth/login',
		failureFlash: true, //실패했을때 메세지 반환
		successFlash: true, // 성공했을때 메세지 반환.
	}),
);

app.use('/api', [
	authRouter,
	UsersRouter,
	PostsRouter,
	CommentsRouter,
]);

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
