require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const { Posts, Users, sequelize } = require('../models/index.js');
const { authMiddleware } = require('../middleware/auth.js');
const {
	postValidator,
	postSameWriterValidator,
	passwordValidator,
} = require('../middleware/validator.js');

const { Op } = require('sequelize');

const path = require('path');
const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
// const multerS3 = require('multer-s3');
// const { promisify } = require('util');
const fs = require('fs');
const convert = require('heic-convert');
const { log } = require('console');

AWS.config.update({
	accessKeyId: process.env.S3_ACCESS_KEY_ID,
	secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
	region: 'ap-northeast-2',
});

// // ==게시물 전체 조회 - content내에서 대표이미지(url?) 가져오는 방법 찾기
router.get('/main', async (req, res) => {
	try {
		//작성일 내림차순 - 최신 작성된 게시글부터 조회
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';

		//게시글 전체 가져오기 (게시글id, 카테고리, 제목, 작성일)
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

		if (!allPosts) {
			return res
				.status(400)
				.json({ success: false, data: '자료가 아직 없어용' });
		}
		//테스트용 - 게시물이 있을 경우
		if (!req.cookies.Authorization) {
			return res.render('main', {
				data: allPosts,
				userId: '',
			});
		}
		const [jwtToken, jwtValue] = req.cookies.Authorization.split(' ');
		const checkJwt = jwt.verify(jwtValue, process.env.SECRET_KEY);
		return res.render('main', {
			userId: checkJwt.userId,
			data: allPosts,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: '게시물 목록 조회에 실패하였습니다.',
		});
	}
});
// ==게시물 카테고리별 조회 -cat , dog, bird, Reptile, Amphibia, Fish
router.get('/main/:category', async (req, res) => {
	try {
		const category = req.params.category;
		console.log('이것은' + category + '입니다.');
		//작성일 내림차순 - 최신 작성된 게시글부터 조회
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
		//게시글 전체 가져오기 (게시글id, 제목)
		const categoryPosts = await Posts.findAll({
			where: {
				category: category,
			},
			attributes: [
				'id',
				'category',
				'imgUrl',
				'title',
				'petName',
				'createdAt',
			],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});
		if (!req.cookies.Authorization) {
			return res.render('category', {
				data: categoryPosts,
				userId: '',
			});
		} else if (req.cookies.Authorization) {
			const [jwtToken, jwtValue] =
				req.cookies.Authorization.split(' ');
			const checkJwt = jwt.verify(jwtValue, process.env.SECRET_KEY);
			console.log(categoryPosts);
			return res.render('category', {
				userId: checkJwt.userId,
				data: categoryPosts,
			});
		}
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: `게시물 목록 조회에 실패하였습니다.`,
		});
	}
});

//* AWS S3 multer 설정

const getPostId = async (req, res, next) => {
	const latestPost = await Posts.findOne({
		order: [['id', 'DESC']],
	});
	req.postId = latestPost ? latestPost.id + 1 : 1;
	next();
};

const upload = multer();

router.get('/post', (req, res) => {
	res.render('upload');
});
// router.get('/post', (req, res, next) => {
// 	res.render('upload', {});
// });

router.post(
	'/post',
	authMiddleware,
	multer().single('imgUrl'),
	postValidator,
	getPostId,
	async (req, res) => {
		try {
			const { title, content, category, petName } = req.body;
			const file = req.file;
			if (!file) {
				return res.status(400).json({
					success: false,
					message: '이미지를 찾을 수 없습니다.',
				});
			}
			const fileTypeHeic = file.mimetype.includes('heic');
			if (fileTypeHeic) {
				//heic 파일 형식 변환.
				const outputBuffer = await convert({
					buffer: file.buffer,
					format: 'JPEG',
					quality: 1,
				});

				const s3 = new AWS.S3();
				console.log('s3', s3);

				const uploadParams = {
					Bucket: 'myejbucket',
					Key: `test/${req.postId}_${path.basename(
						file.originalname,
					)}.jpg`,
					Body: outputBuffer,
					ACL: 'public-read',
					ContentType: 'image/jpeg',
				};
				console.log('업로드파람스', uploadParams);

				const uploadResult = await s3.upload(uploadParams).promise();
				console.log('업로드리졸트', uploadResult);
				const imgUrl = uploadResult.Location;

				const createPost = await Posts.create({
					userId: res.locals.user.id,
					title,
					content,
					imgUrl,
					category,
					petName,
				});
			} else {
				const s3 = new AWS.S3();

				const uploadParams = {
					Bucket: 'myejbucket',
					Key: `test/${req.postId}_${path.basename(
						file.originalname,
					)}.jpg`,
					Body: req.file.buffer,
					ACL: 'public-read',
				};

				const uploadResult = await s3.upload(uploadParams).promise();
				const imgUrl = uploadResult.Location;
				const createPost = await Posts.create({
					userId: res.locals.user.id,
					title,
					content,
					imgUrl,
					category,
					petName,
				});
			}
			return res.redirect('/api/main');
		} catch (error) {
			console.log(error);
			return res.status(400).json({
				success: false,
				message: '게시글 등록에 실패하였습니다.',
			});
		}
	},
);

// ==게시물 삭제
router.delete(
	'/post/:postId',
	authMiddleware,
	postSameWriterValidator,
	passwordValidator,
	async (req, res) => {
		console.log('삭제중');
		try {
			const postId = req.params.postId;
			const { password } = req.body;
			const checkPost = await Posts.findOne({
				where: {
					id: postId,
				},
				include: {
					model: Users,
					as: 'User',
					attributes: ['id'],
				},
			});
			console.log('checkPost', checkPost);
			const checkedPassword = await Users.findOne({
				where: {
					id: checkPost.userId,
				},
			});
			console.log('checkedPassword ', checkedPassword);
			console.log('사용자입력 비번', password);
			const isSame = await bcrypt.compare(
				password,
				checkedPassword.password,
			);
			console.log('isSame', isSame);
			//비밀번호 체크
			if (!isSame) {
				return res.render('blank', {
					message: '입력하신 비밀번호가 올바르지 않습니다.',
				});
			}
			checkPost.destroy();
			return res.status(200).redirect('/api/main');
			// }
		} catch {
			return res.render('blank', {
				message: '게시물 삭제에 실패했습니다.',
			});
		}
	},
);

// ==게시물 검색 / 타이틀 부분검색 - 구현중
router.get('/search/:searchWord', async (req, res) => {
	try {
		const searchWord = req.params.searchWord;
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';

		const searchPosts = await Posts.findAll({
			where: {
				title: { [Op.like]: `%${searchWord}%` },
			},
			attributes: ['id', 'category', 'imgUrl', 'title', 'createdAt'],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});
		console.log('searchPosts', searchPosts);
		if (!searchPosts) {
			return res.render('blank', {
				message: '검색결과가 없습니다.',
			});
		}
		const token = req.cookies.Authorization.split(' ')[1];
		const userId = jwt.decode(token).userId;

		return res.render('main', { userId, data: searchPosts });
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: `게시물 목록 조회에 실패하였습니다.`,
		});
	}
});

// 수정 Post modify창으로 가기
router.get(
	'/post/modify/:postId',
	authMiddleware,
	// postValidator,
	async (req, res) => {
		try {
			const { postId } = req.params;
			const postsDetail = await Posts.findOne({
				where: {
					id: postId,
				},
				attributes: [
					'id',
					'category',
					'title',
					'content',
					'imgUrl',
					'petName',
					'createdAt',
				],
				include: {
					model: Users,
					as: 'User',
					attributes: ['name'],
				},
			});
			return res.render('modifyPost', {
				postsDetail,
			});
		} catch (error) {
			console.log(error);
			return res.status(500).json({
				success: false,
				message: `게시물 조회에 실패하였습니다.`,
			});
		}
	},
);
// ==게시물 수정 - 인증 미들웨어 확인 필요 - 접근이 안되는중
router.patch(
	'/post/modify/:postId',
	authMiddleware,
	postValidator,
	async (req, res) => {
		try {
			console.log(req.body);
			const postId = req.params.postId;
			const localsUserId = res.locals.user.id;
			console.log(postId + '<<<<post Id');
			console.log(localsUserId + '<<<< localsUserId');
			const { category, title, content, petName } = req.body;
			console.log(req.body);
			console.log(
				'req바디' + category,
				title,
				content,
				petName + '수정값',
			);
			//해당 게시물 정보 가져오기
			const postsDetail = await Posts.findOne({
				where: {
					id: postId,
				},
				attributes: [
					'id',
					'category',
					'title',
					'content',
					'imgUrl',
					'petName',
					'createdAt',
				],
			});
			await postsDetail.update({
				title,
				content,
				category,
				petName,
			});
			res.redirect(`/api/post/${postsDetail.id}`);
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: '게시물 수정에 실패하였습니다.',
			});
		}
	},
);

module.exports = router;
