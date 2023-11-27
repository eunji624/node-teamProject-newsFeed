const passport = require('passport');
const kakao = require('./kakaoStrategy.js');

const { Users } = require('../models');

module.exports = () => {
	passport.serializeUser((user, done) => {
		done(null, user.id);
	});
	passport.deserializeUser((id, done) => {
		Users.findOne({ where: { id } }).then(user => done(null, user));
	});

	kakao();
};
