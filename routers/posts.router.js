require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();
const { Posts, Users, sequelize } = require('../models/index.js');
const { authMiddleware } = require('../middleware/auth.js');
const {
	postValidator,
	postSameWriterValidator,
} = require('../middleware/validator.js');

const Op = sequelize.Op;

const path = require('path');
const AWS = require('aws-sdk');
const S3 = require('aws-sdk/clients/s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
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
		// console.log(allPosts);
		//테스트용 - 게시물이 있을 경우
		if (allPosts) {
			try {
				if (!req.cookies.Authorization) {
					return res.render('main', {
						data: allPosts,
						userId: '',
					});
				} else if (req.cookies.Authorization) {
					const [jwtToken, jwtValue] =
						req.cookies.Authorization.split(' ');
					const checkJwt = jwt.verify(
						jwtValue,
						process.env.SECRET_KEY,
					);
					return res.render('main', {
						userId: checkJwt.userId,
						data: allPosts,
					});
				}
			} catch (err) {
				console.log(err);
			}
		} else {
			return res
				.status(400)
				.json({ success: false, data: '자료가 아직 없어용' });
		}
	} catch {
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

	// if (!latestPost) {
	// 	return res.status(400).json({ message: '오류떳엉' });
	// }
	req.postId = latestPost ? latestPost.id + 1 : 1;
	next();
};
const upload = multer({
	storage: multerS3({
		s3: new AWS.S3(),
		bucket: 'node-itspet',
		acl: 'public-read',
		contentType: multerS3.AUTO_CONTENT_TYPE,
		key(req, file, cb) {
			cb(
				null,
				`test/${req.postId}_${path.basename(file.originalname)}`,
			); // test 폴더안에다 파일을 123123123123_asdasd.jpg형식으로 저장
		},
	}),
	limits: { fileSize: 5 * 1024 * 1024 },
});

router.get('/upload', (req, res) => {
	res.render('upload');
});
router.post(
	'/upload',
	authMiddleware,
	getPostId,
	upload.single('imgUrl'),
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
			const maxId = await Posts.findOne({
				order: [['id', 'DESC']],
			});
			const createPost = await Posts.create({
				userId: res.locals.user.id,
				title,
				content,
				imgUrl: `${process.env.IMG_URL}${req.postId}_${path.basename(
					file.originalname,
				)}`,
				category,
				petName,
			});
			return res.redirect('/api/main');
		} catch (error) {
			return res.status(400).json({
				success: false,
				message: '게시글 등록에 실패하였습니다.',
			});
		}
	},
);

router.get('/post', (req, res, next) => {
	res.render('upload', {});
});

// ==게시물 작성 - 로그인 해야 가능
router.post(
	'/post',
	authMiddleware,
	postValidator,
	async (req, res) => {
		try {
			const { title, content, category, petName } = req.body;
			await Posts.create({
				userId: res.locals.user.id,
				title,
				content,
				category,
				petName,
			});

			return res.status(200).json({
				success: true,
				message: '게시글이 등록되었습니다.',
				Posts,
			});
		} catch {
			return res.status(400).json({
				success: false,
				message: '게시글 등록에 실패하였습니다.',
			});
		}
	},
);

// ==게시물 수정 - 인증 미들웨어 확인 필요
router.put(
	'/post/:postId',
	authMiddleware,
	postValidator,
	postSameWriterValidator,
	async (req, res) => {
		try {
			const postId = req.params.postId;
			//로그인 한 유저 아이디 가져오기
			const localsUserId = res.locals.user.id;
			const { category, title, content, petName } = req.body;
			//해당 게시물 정보 가져오기
			const thisPost = await Posts.findOne({
				where: { id: postId },
				attributes: [
					'id',
					'userId',
					'category',
					'title',
					'content',
					'petName',
					'createdAt',
				],
			});
			//게시물 없을 경우
			if (!thisPost) {
				return res.status(401).json({
					success: false,
					message: '존재하지 않는 게시물입니다.',
				});
			}
			//게시물 존재하고 내가 쓴 글이 아닐 경우 - 수정하고 수정된 게시물 보여주기
			if (localsUserId !== thisPost.userId) {
				return res
					.status(401)
					.json({ success: true, message: '수정 권한이 없습니다.' });
			}
			if (localsUserId === thisPost.userId) {
				await thisPost.update(
					{ category, title, content, petName },
					{ where: { id: postId } },
				);
			}
			return res.status(200).json({ success: true, data: thisPost });
		} catch (error) {
			return res.status(500).json({
				success: false,
				message: '게시물 수정에 실패하였습니다.',
			});
		}
	},
);

// ==게시물 삭제
router.delete(
	'/post/:postId',
	authMiddleware,
	postSameWriterValidator,
	async (req, res) => {
		try {
			const postId = req.params.postId;
			//삭제가능
			const postDelete = await Posts.destroy({
				where: {
					id: postId,
				},
			});
			if (postDelete) {
				return res.status(200).json({
					success: true,
					message: '게시물이 삭제되었습니다.',
				});
			}
			return res.status(404).json({
				success: false,
				message: '존재하지 않는 게시물입니다.',
			});
		} catch {
			return res.status(500).json({
				success: false,
				message: '게시물 삭제에 실패하였습니다.',
			});
		}
	},
);

// ==게시물 검색 / 타이틀 부분검색 - 구현중
router.get('/search/:searchWord', async (req, res) => {
	try {
		const searchWord = req.params.searchWord;
		console.log('이것은' + category + '입니다.');
		//작성일 내림차순 - 최신 작성된 게시글부터 조회
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
		//게시글 전체 가져오기 (게시글id, 제목)
		const searchPosts = await Posts.findAll({
			where: {
				title: { [Op.like]: '%' + searchWord + '%' },
			},
			attributes: ['id', 'category', 'title', 'createdAt'],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});
		return res.status(200).json({ success: true, data: searchPosts });
	} catch (error) {
		console.log(error);
		return res.status(500).json({
			success: false,
			message: `게시물 목록 조회에 실패하였습니다.`,
		});
	}
});

module.exports = router;
