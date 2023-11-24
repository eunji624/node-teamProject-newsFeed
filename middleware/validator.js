const {
	validationResult,
	body,
	check,
	query,
	param,
	checkSchema,
} = require('express-validator');
const { Posts, Users, Comments } = require('../models');

// const express = require('express');
// const router = express.Router();

const errorMsgMiddleware = (req, res, next) => {
	const errors = validationResult(req);
	if (errors.isEmpty()) {
		return next();
	}
	return res.status(400).json({
		success: false,
		error: {
			code: 400,
			message: errors.array()[0].msg,
			// detail: errors.errors,
		},
	});
};

const registerValidator = [
	body('name')
		.notEmpty()
		.trim()
		.withMessage(`이름을 입력해 주세요`)
		.custom(value => {
			if (/\s/.test(value)) {
				throw new Error('이름에 공백을 포함할 수 없습니다');
			}
			return true;
		}),

	body('email')
		.notEmpty()
		.withMessage('이메일을 입력해 주세요')
		.isEmail()
		.normalizeEmail()
		.withMessage('이메일을 확인해 주세요'),

	body('password')
		.notEmpty()
		.withMessage('비밀번호를 입력해 주세요')
		.isLength({ min: 6 }, { max: 10 })
		.withMessage('비밀번호를 6자리 이상 입력해 주세요')
		.custom(value => {
			if (/\s/.test(value)) {
				throw new Error('비밀번호에 공백을 포함할 수 없습니다');
			}
			return true;
		}),

	body('passwordRe')
		.custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error('비밀번호를 확인해 주세요');
			}
			return true;
		})
		.withMessage('비밀번호를 확인해 주세요'),

	body('description').default('안녕하세요!'),
	errorMsgMiddleware,
];

const loginValidator = [
	body('email')
		.notEmpty()
		.withMessage('이메일을 입력해 주세요')
		.isEmail()
		.normalizeEmail()
		.withMessage('이메일을 확인해 주세요'),

	body('password')
		.notEmpty()
		.withMessage('비밀번호를 입력해 주세요')
		.isLength({ min: 6 }, { max: 10 })
		.withMessage('비밀번호를 6자리 이상 입력해 주세요')
		.custom(value => {
			if (/\s/.test(value)) {
				throw new Error('비밀번호에 공백을 포함할 수 없습니다');
			}
			return true;
		}),
	errorMsgMiddleware,
];

const postValidator = [
	body('title').notEmpty().withMessage('제목은 필수 입력입니다.'),
	body('content').notEmpty().withMessage('내용은 필수 입력입니다.'),
	body('category')
		.custom(value => {
			console.log('값', value);
			if (value !== 'dog' && value !== 'cat' && value !== 'ect') {
				throw new Error('카테고리를 지정해주세요.');
			}
			return true;
		})
		.withMessage('카테고리를 지정해주세요.'),
	body('petName')
		.notEmpty()
		.withMessage('반려동물의 이름을 입력해 주세요'),
	errorMsgMiddleware,
];

const commentValidator = [
	body('content').notEmpty().withMessage('내용을 입력해 주세요.'),
	errorMsgMiddleware,
];

//검증함수
async function isSameWriter(data, jwtUserId) {
	if (!data) {
		return res.status(400).json({
			success: false,
			message: '해당 글은 존재하지 않습니다.',
		});
	}
	if (data.userId !== jwtUserId) {
		return res.status(400).json({
			success: false,
			message: '해당 글의 작성자가 아닙니다.',
		});
	}
}

//Posts 입력값에 해당하는 데이터 찾아서 검증함수 호출
const postSameWriterValidator = async (req, res, next) => {
	const jwtUserId = res.locals.user.id;
	const postId = req.params.postId;
	const findData = await Posts.findOne({ where: { id: postId } });
	isSameWriter(findData, jwtUserId);
	next();
};

//Comments 입력값에 해당하는 데이터 찾아서 검증함수 호출
const commentSameWriterValidator = async (req, res, next) => {
	const jwtUserId = res.locals.user.id;
	const commentId = req.params.commentId;
	const findData = await Comments.findOne({
		where: { commentId: commentId },
	});
	isSameWriter(findData, jwtUserId);
	next();
};

//회원가입시 기존 회원의 정보와 동일하지 않도록 검증
const alreadyRegister = async (req, res, next) => {
	const { name, email } = req.body;
	const isSameName = await Users.findOne({ where: { name } });
	const isSameEmail = await Users.findOne({ where: { email } });

	if (isSameName) {
		return res.status(400).json({
			success: false,
			message: '이미 존재하는 이름 입니다.',
		});
	}
	if (isSameEmail) {
		return res.status(400).json({
			success: false,
			message: '이미 존재하는 이메일 입니다.',
		});
	}
	next();
};

module.exports = {
	errorMsgMiddleware,
	registerValidator,
	loginValidator,
	postValidator,
	commentValidator,
	postSameWriterValidator,
	commentSameWriterValidator,
	alreadyRegister,
};
