require('dotenv').config();

const passport = require('passport');
const kakaoStrategy = require('passport-kakao').Strategy;
const bcrypt = require('bcrypt');

const { Users } = require('../models');

const kakaoLogin = () => {
	passport.use(
		new kakaoStrategy(
			{
				clientID: process.env.KAKAO_ID,
				callbackURL: '/api/kakao/callback',
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					const exUser = await Users.findOne({
						where: { email: profile._json.kakao_account.email },
					});

					const hashPwd = await bcrypt.hash('profile.id', 11);

					if (exUser) {
						done(null, exUser);
					} else {
						const newUser = await Users.create({
							email: profile._json.kakao_account.email,
							name: profile.displayName,
							password: hashPwd, //수정
							provider: 'kakao',
						});
						done(null, newUser);
					}
				} catch (err) {
					done(err);
				}
			},
		),
	);
};

module.exports = kakaoLogin;
