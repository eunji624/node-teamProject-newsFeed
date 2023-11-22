require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { Users } = require('../models/index.js');
const { authMiddleware } = require('../middleware/auth.js');
const router = express.Router();

//회원 가입
router.post('/register', async (req, res, next) => {
	try {
		const { name, email, password, description } = req.body;

		const sortPassword = await bcrypt.hash(req.body.password, 11);
		const newData = await Users.create({
			name,
			email,
			password: sortPassword,
			description,
		});

		res.status(201).json({ success: 'true', message: newData });
	} catch (err) {
		console.log(err);
	}
});

//로그인 기능
router.post('/auth/login', async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const userData = await Users.findOne({ where: { email } });

		const isSame = await bcrypt.compare(password, userData.password);
		const token = jwt.sign(
			{ userId: userData.id },
			process.env.SECRET_KEY,
			{ expiresIn: '10h' },
		);
		req.headers.authorization = `Bearer ${token}`;

		res
			.status(200)
			.json({ success: 'true', message: req.headers.authorization });
	} catch (err) {
		console.log(err);
	}
});

//로그아웃 기능 __ 로그인 된 상태에서만 로그아웃 버튼이 보이도록 처리.
router.get('/auth/logout', authMiddleware, async (req, res, next) => {
	try {
		//만료 시키는 방법으로 변경.
		req.headers.authorization = '';
		console.log('빔', req.headers.authorization);
	} catch (err) {
		console.log(err);
	}
});

//회원탈퇴 기능 __ 인증미들웨어 거치고 할 예정.(비밀번호 한번더 입력 받는것도 좋은것 같아요)
router.delete(
	'/users/:userId',
	authMiddleware,
	async (req, res, next) => {
		try {
			console.log('auth잘 돌아감', res.locals.user);
			const id = req.params.userId;
			const tokenValue = req.headers.authorization.split(' ')[1];
			const decodeValue = jwt.decode(tokenValue);
			if (Number(id) === decodeValue.userId) {
				// await Users.destroy({ where: { id } });
			}
		} catch (err) {
			console.log(err);
		}
	},
);

//회원 정보조회 기능
router.get(
	'/users/:userId',
	authMiddleware,
	async (req, res, next) => {
		try {
			const id = req.params.userId;
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

			res.status(200).json({ success: 'true', message: userData });
		} catch (err) {
			console.log(err);
		}
	},
);

//회원정보 수정 기능
router.patch(
	'/users/:userId',
	authMiddleware,
	async (req, res, next) => {
		try {
			const { name, email, description } = req.body;
			const id = req.params.userId;

			await Users.update(
				{ name, email, description },
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
