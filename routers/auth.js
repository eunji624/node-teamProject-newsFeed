require('dotenv').config();

const express = require('express');
const passport = require('passport');
const router = express.Router();
const jwt = require('jsonwebtoken');

const { Result } = require('express-validator');

router.get('/kakao', passport.authenticate('kakao'));

router.get(
	'/kakao/callback',
	passport.authenticate('kakao', {
		failureRedirect: '/api/login',
		// successRedirect: '/api/main',
	}),
	async (req, res) => {
		const userId = req.user.dataValues.id;
		const token = jwt.sign(
			{ userId: userId },
			process.env.SECRET_KEY,
			{
				expiresIn: '12h',
			},
		);
		res.cookie('Authorization', `Bearer ${token}`);
		res.locals.user = { userId: req.user.dataValues.id };
		res.redirect('/api/main');
	},
);

module.exports = router;
