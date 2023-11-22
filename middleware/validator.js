const {
	query,
	validationResult,
	check,
} = require('express-validator');
console.log(query);
const express = require('express');
const router = express.Router();

const registerValidator = (req, res, next) => {
	query('name').notEmpty().withMessage(`이름을 입력해 주세요`);
	// query('email')
	// 	.notEmpty()
	// 	.withMessage(`이메일을 입력해 주세요`)
	// 	.isEmail()
	// 	.withMessage(`이메일에 형식에 맞춰 사용해 주세요`),
	// query('description').withMessage(`자기소개를 입력해 주세요`),
	// query('password').withMessage(`비밀번호를 입력해 주세요`),
	// query('passwordRe').custom((value, { req }) => {
	// 	return value === req.query.password;
	// });
	// .withMessage(`비밀번호를 입력해 주세요`),
};

module.exports = { registerValidator };

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
