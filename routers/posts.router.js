const express = require('express');
const router = express.Router();
const { Posts, Users, Comments, sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth.js');

const Op = sequelize.Op;

require('dotenv').config();

// 게시물 전체 조회 - content내에서 대표이미지(url?) 가져오는 방법 찾기
router.get('/main', async (req, res) => {
	try {
		//작성일 내림차순 - 최신 작성된 게시글부터 조회
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
		//게시글 전체 가져오기 (게시글id, 카테고리, 제목, 작성일)
		const Allposts = await Posts.findAll({
			attributes: ['id', 'category', 'title', 'updatedAT'],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});
		//테스트용 - 게시물이 있을 경우
		if (Allposts) {
			return res.status(200).json({ success: true, data: Allposts });
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

// 게시물 카테고리별 조회 -cat , dog, bird, Reptile, Amphibia, Fish
router.get('/main/:category', async (req, res) => {
	try {
		const category = req.params.category;
		//작성일 내림차순 - 최신 작성된 게시글부터 조회
		const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
		//게시글 전체 가져오기 (게시글id, 제목)
		const categoryPosts = await Posts.findAll({
			where: {
				category: category,
			},
			attributes: ['id', 'category', 'title', 'petName', 'createdAt'],
			include: [
				{
					model: Users,
					attributes: ['name'],
				},
			],
			order: [['updatedAt', sort]],
		});

		return res
			.status(200)
			.json({ success: true, data: categoryPosts });
	} catch {
		return res.status(500).json({
			success: false,
			message: `게시물 목록 조회에 실패하였습니다.`,
		});
	}
});

// 게시물 작성 - 로그인 해야 가능
router.post('/post', authMiddleware, async (req, res) => {
	try {
		const { title, content, category, petName } = req.body;
		//빈칸이 있을 경우 - 미들웨어 처리
		if (!title) {
			return res.status(400).json({
				success: false,
				message: '제목은 필수 입력입니다.',
			});
		}
		if (!content) {
			return res.status(400).json({
				success: false,
				message: '내용은 필수 입력입니다.',
			});
		}
		if (!category) {
			return res.status(400).json({
				success: false,
				message: '카테고리를 지정해주세요.',
			});
		}
		//로그인한 유저 아이디 가져와서 글 작성 - 미드웨어로 로그인 확인 필요
		const reShowData = await Posts.create({
			id: res.locals.user.id,
			title,
			content,
			category,
			petName,
		});
		return res.status(200).json({
			success: true,
			message: '게시글이 등록되었습니다.',
			reShowData,
		});
	} catch {
		return res.status(400).json({
			success: false,
			message: '게시글 등록에 실패하였습니다.',
		});
	}
});

// 게시물 수정 - 인증 미들웨어 확인 필요
router.get('/post/:postId', async (req, res) => {
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
				'category',
				'title',
				'content',
				'petName',
				'createdAt',
			],
			include: [
				{
					model: Users,
					attributes: ['Name'],
				},
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
		if (thisPost && localsUserId !== thisPost.userId) {
			return res
				.status(401)
				.json({ success: true, message: '수정 권한이 없습니다.' });
		}
		if (thisPost && localsUserId === thisPost.userId) {
			const postUpdate = await thisPost.update(
				{ category, title, content, petName },
				{ where: { id: postId } },
			);
		}
		return res.status(200).json({ success: true, data: thisPost });
	} catch {
		return res.status(500).json({
			success: false,
			message: '게시물 수정에 실패하였습니다.',
		});
	}
});

// 게시물 삭제
router.delete('/post/:postId', authMiddleware, async (req, res) => {
	try {
		const postId = req.params.postId;
		//로그인 한 유저 아이디 가져오기
		const localsUserId = res.locals.user.id;
		//해당 게시물 정보 가져오기
		const thisPost = await Posts.findOne({
			where: { id: postId },
			attributes: [
				'id',
				'category',
				'title',
				'content',
				'petName',
				'createdAt',
			],
			include: [
				{
					model: Users,
					attributes: ['Name'],
				},
			],
		});
		//해당 게시물이 존재하지 않음
		if (!thisPost) {
			return res.status(401).json({
				success: false,
				message: '존재하지 않는 게시물입니다.',
			});
		}
		//로그인 한 사람이 작성자가 아님
		if (thisPost && localsUserId !== thisPost.userId) {
			return res
				.status(401)
				.json({ success: false, message: '삭제 권한이 없습니다.' });
		}
		//삭제가능
		if (thisPost && localsUserId === thisPost.userId) {
			const postDelete = await thisPost.destroy();
			return res
				.status(200)
				.json({ success: true, message: '게시물이 삭제되었습니다.' });
		}
	} catch {
		return res.status(500).json({
			success: false,
			message: '게시물 삭제에 실패하였습니다.',
		});
	}
});

module.exports = router;
