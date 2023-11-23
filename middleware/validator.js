const {
	validationResult,
	body,
	check,
	query,
	param,
	checkSchema,
} = require('express-validator');
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
			return ture;
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
	registerValidator[1],
	registerValidator[2],
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

const trimValidator = [];
module.exports = {
	errorMsgMiddleware,
	registerValidator,
	loginValidator,
	postValidator,
	commentValidator,
};

// 공백 에러 내뿜는 함수 생성. [v]
//작성자 맞는지 함수
//닉네임, 이메일 중복불가 함수
