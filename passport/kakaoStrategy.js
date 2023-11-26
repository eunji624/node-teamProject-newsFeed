require('dotenv').config();

const passport = require('passport');
const kakaoStrategy = require('passport-kakao').Strategy;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Users } = require('../models');

const kakaoLogin = () => {
	passport.use(
		new kakaoStrategy(
			{
				clientID: process.env.KAKAO_ID,
				callbackURL: '/api/kakao/callback',
				// callbackURL: '/api/main',
			},
			async (accessToken, refreshToken, profile, done) => {
				console.log('profile', profile);
				try {
					const exUser = await Users.findOne({
						where: { email: profile._json.kakao_account.email },
					});
					if (exUser) {
						done(null, exUser);
					} else {
						const newUser = await Users.create({
							email: profile._json.kakao_account.email,
							name: profile.displayName,
							password: profile.id, //수정
							snsId: profile.id,
							provider: 'kakao',
						});
						done(null, newUser);
					}
				} catch (err) {
					console.log('없음');
					done(err);
				}
			},
		),
	);
};

module.exports = kakaoLogin;
