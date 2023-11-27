require('dotenv').config();

const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Users, Posts } = require('../models/index.js');
const { authMiddleware } = require('../middleware/auth.js');
const {
	loginValidator,
	registerValidator,
	alreadyRegister,
	modifyValidator,
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
			return res.render('blank', {
				message: '입력하신 이메일에 해당하는 회원정보가 없습니다.',
			});
		}
		const isSame = await bcrypt.compare(password, userData.password);
		if (!isSame) {
			return res.render('blank', {
				message: '입력하신 비밀번호가 올바르지 않습니다.',
			});
		}

		const token = jwt.sign(
			{ userId: userData.id },
			process.env.SECRET_KEY,
			{ expiresIn: '12h' },
		);
		console.log(token);
		return res
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
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
		const allPosts = await Posts.findAll({
			attributes: ['id', 'category', 'imgUrl', 'title', 'updatedAT'],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});
		return res.clearCookie('Authorization').redirect('/api/main');
	} catch (err) {
		console.log(err);
	}
});

//회원탈퇴 기능
router.post(
	'/user/:userId',
	authMiddleware,
	async (req, res, next) => {
		const id = req.params.userId;
		const tokenValue = req.cookies.Authorization.split(' ')[1];
		const decodeValue = jwt.decode(
			tokenValue,
			process.env.SECRET_KEY,
		);
		//해당 회원이 맞는 경우만 삭제
		if (Number(id) === decodeValue.userId) {
			console.log('디코디드벨류 유저아이디=>', decodeValue.userId);
			res.clearCookie('Authorization');
			try {
				await Users.destroy({ where: { id: decodeValue.userId } });
				console.log('삭제완료');
				// res.redirect('/api/main');
				res.render('withDraw');
			} catch (err) {
				console.log(err);
			}
			// await res.clearCookie();
		}
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
//회원정보 수정 보여주기
router.get('/user/modify/:userId', async (req, res, next) => {
	const userData = await Users.findOne({
		where: { id: req.params.userId },
	});
	if (userData.provider === 'kakao') {
		res.render('modifyUserInfo', {
			userId: req.params.userId,
			data: userData,
			pwd: '',
		});
	}
	res.render('modifyUserInfo', {
		userId: req.params.userId,
		data: userData,
		pwd: true,
	});
});

//회원정보 수정 기능
router.post(
	'/user/modify/:userId',
	authMiddleware,
	modifyValidator,
	async (req, res, next) => {
		try {
			const { name, email, description, password, passwordRe } =
				req.body;
			const id = req.params.userId;
			if (password !== passwordRe) {
				res.render('blank', {
					message: '비밀번호가 일치하지 않습니다.',
				});
			}

			const hashPwd = await bcrypt.hash(password, 11);

			await Users.update(
				{ name, email, description, password: hashPwd },
				{ where: { id } },
			);
			const showUserData = await Users.findOne({ where: { id } });
			res.redirect('/api/user/info');
		} catch (err) {
			console.log(err);
		}
	},
);

module.exports = router;
