const {
	query,
	validationResult,
	check,
	body,
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
	body('name').notEmpty().trim().withMessage(`이름을 입력해 주세요`),

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
		.withMessage('비밀번호를 6자리 이상 입력해 주세요'),

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
module.exports = {
	errorMsgMiddleware,
	registerValidator,
	loginValidator,
};

// 공백 에러 내뿜는 함수 생성.

//회원가입
//입력값이 빈값인 경우
//이메일이 형식에 맞지 않는 경우
//비밀번호가 6자 이상, 공백없이,

//닉네임 중복 불가__ 함수로 빼서
//이메일 중복 불가__ 함수로 빼서.

//로그인
//입력값이 빈값인 경우
//이메일이 형식에 맞지 않는 경우
//비밀번호가 6자 이상, 공백없이,

//-----------로그인 했는가.(토큰검증)
//post 생성
//입력값 빈값인 경우

//post 수정(PUT으로 변경)
//입력값이 빈값인 경우
//토큰 유저가 해당 게시글 작성자가 맞는지

//post 삭제
//토큰 유저가 해당 게시글 작성자가 맞는지

//comment 작성
//입력값이 빈값인 경우

//comment 수정
//입력값이 빈값인 경우
//토큰 유저가 해당 게시글 작성자가 맞는지

//comment 삭제
//토큰 유저가 해당 게시글 작성자가 맞는지
