require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Users } = require('../models/index.js');
const { authMiddleware } = require('../middleware/auth.js');
const {
	loginValidator,
	registerValidator,
	alreadyRegister,
} = require('../middleware/validator.js');

const router = express.Router();
const { body, validationResult } = require('express-validator');

router.get('/register', async (req, res, next) => {
	res.render('register');
});

//회원 가입
router.post(
	'/register',
	registerValidator,
	alreadyRegister,
	async (req, res, next) => {
		try {
			const { name, email, password, description } = req.body;
			const sortPassword = await bcrypt.hash(password, 11);
			const newData = await Users.create({
				name,
				email,
				password: sortPassword,
				description,
			});
			return res.render('login');
			// res.status(201).json({ success: 'true', message: newData });
		} catch (err) {
			console.log(err);
		}
	},
);

//로그인 기능 보여주기
router.get('/auth/login', async (req, res, next) => {
	console.log('또잉');
	res.render('login');
});

//로그인 기능 디비에 접근하기.
router.post('/auth/login', loginValidator, async (req, res, next) => {
	console.log('로그인기능');

	try {
		const { email, password } = req.body;
		const userData = await Users.findOne({ where: { email } });
		if (!userData) {
			res.render('blank', {
				message: '입력하신 이메일에 해당하는 회원정보가 없습니다.',
			});
		}
		const isSame = await bcrypt.compare(password, userData.password);
		if (!isSame) {
			res.render('blank', {
				message: '입력하신 비밀번호가 올바르지 않습니다.',
			});
		}

		const token = jwt.sign(
			{ userId: userData.id },
			process.env.SECRET_KEY,
			{ expiresIn: '12h' },
		);
		console.log(token);
		res
			.cookie('Authorization', `Bearer ${token}`)
			.redirect('/api/main');
		// res.render('login');
		// res.status(200).json({
		// 	success: 'true',
		// 	message: `Bearer ${token}`,
		// });
	} catch (err) {
		res.status(400).json({ message: err.message });
	}
});

//로그아웃 기능 __ 로그인 된 상태에서만 로그아웃 버튼이 보이도록 처리.
router.get('/auth/logout', authMiddleware, async (req, res, next) => {
	try {
		//만료 시키는 방법으로 변경.
		req.headers.authorization = '';
		console.log('빔', req.headers.authorization);
		res.render('main', { userId: '' });
	} catch (err) {
		console.log(err);
	}
});

//회원탈퇴 기능
router.post(
	'/user/:userId',
	authMiddleware,
	async (req, res, next) => {
		console.log('들어옴');
		const id = req.params.userId;
		const tokenValue = req.cookies.Authorization.split(' ')[1];
		console.log(tokenValue);

		const decodeValue = jwt.decode(
			tokenValue,
			process.env.SECRET_KEY,
		);
		if (Number(id) === decodeValue.userId) {
			await Users.destroy({ where: { id } });
			console.log('삭제완료');
			// await res.clearCookie();
			res.cookie('Authorization', '');
			console.log(res.cookies);
		}
		res.render('withDraw');
	},
);

//회원 정보조회 기능
router.get(
	'/user/:userId',
	authMiddleware,
	async (req, res, next) => {
		let userId = '';
		try {
			const id = res.locals.user.id;
			const userData = await Users.findOne({
				where: { id },
				attributes: ['name', 'email', 'description'],
			});

			if (!userData) {
				res.status(404).json({
					success: 'false',
					message: '찾으시는 유저 정보가 없습니다.',
				});
			}

			// res.status(200).json({ success: 'true', message: userData });
			if (req.cookies.Authorization) {
				userId = req.cookies.Authorization.split;
			}
			res.render('info', { userData: userData, userId: id });
		} catch (err) {
			console.log(err);
		}
	},
);

//회원정보 수정 기능
router.patch(
	'/users/:userId',
	authMiddleware,
	registerValidator,
	async (req, res, next) => {
		try {
			const { name, email, description, password, passwordRe } =
				req.body;
			const id = req.params.userId;

			//passwordRe 확인할것
			await Users.update(
				{ name, email, description, password },
				{ where: { id } },
			);
			const showUserData = await Users.findOne({ where: { id } });
			res
				.status(200)
				.json({ success: 'true', message: showUserData });
		} catch (err) {
			console.log(err);
		}
	},
);

module.exports = router;
