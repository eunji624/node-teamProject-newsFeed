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
	//req.session에 저장하는 역할 __ 딱 한번 호출됨.
	done(null, user.id); //식별값 넣어줌. 이렇게 하면 "passport:{user: 34} 이런식으로 저장함."
});

passport.deserializeUser(function (user, done) {
	//req.user에 저장
	//여기서 파라미터 값으로 받아오는 user는 serializeUser에서 넘어온 id
	// 이거 이용해서 데이터 찾고  req.user에 저장함.
	// 저장된 데이터 기준으로 필요한 정보 찾을때 사용. 그리고 req.user에 저장함.(패스포트의 약속임)
	done(null, authData); //전달할 데이터 두번째 인자에 넣어주기.
	//이렇게 하면 router.get 같은 요청하려 하는 라우터에 정보를 넘겨줌 req.user로
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

// app.use('/auth', authRouter);

app.use('/api', [
	authRouter,
	UsersRouter,
	PostsRouter,
	CommentsRouter,
]);

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
