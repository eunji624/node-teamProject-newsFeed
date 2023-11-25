const express = require('express');
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middleware/auth.js');
const router = express.Router();
const { Posts, Users, Comments } = require('../models/index.js');
const {
	commentValidator,
	commentSameWriterValidator,
	passwordValidator,
} = require('../middleware/validator.js');
require('dotenv').config();
const jwt = require('jsonwebtoken');

// C created
router.post(
	'/comment/:postId',
	authMiddleware,
	commentValidator,
	async (req, res) => {
		const { content } = req.body;
		const { postId } = req.params;
		const createdProduct = await Comments.create({
			userId: res.locals.user.id,
			postId: postId,
			content,
		});
		return res.redirect(`/api/post/${postId}`); //미쳤다
	},
);
// C created

// R Read

// 댓글 목록 조회
router.get('/post/:postId', async (req, res) => {
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
	const commentsList = await Comments.findAll({
		where: { postId: postId },
		attributes: ['content', 'commentId', 'updatedAt', 'userId'],
		include: {
			model: Users,
			as: 'User',
			attributes: ['name'],
		},
		order: [['updatedAt', 'DESC']],
	});
	// ~~
	if (postsDetail) {
		try {
			if (!req.cookies.Authorization) {
				return res.render('postDetail', {
					postsDetail,
					commentsList,
					userId: '',
				});
			} else if (req.cookies.Authorization) {
				const [jwtToken, jwtValue] =
					req.cookies.Authorization.split(' ');
				const checkJwt = jwt.verify(jwtValue, process.env.SECRET_KEY);
				return res.render('postDetail', {
					userId: checkJwt.userId,
					postsDetail,
					commentsList,
				});
			}
		} catch (err) {
			console.log(err);
		}
	}
	// ~~
	// console.log(commentsList);
	// res.render('postDetail', { postsDetail, commentsList });
	// res.send({ success: true, postsDetail, commentsList });
});
// R Read

// //  U Update

router.patch(
	'/comment/:commentId',
	authMiddleware,
	commentValidator,
	commentSameWriterValidator,
	async (req, res) => {
		try {
			const { commentId } = req.params;
			const selectedComment = await Comments.findOne({
				where: {
					commentId: commentId,
				},
			});
			let { content } = req.body;
			if (content === selectedComment.content) {
				// 409 Conflict  값들끼리 충돌 날 때
				return res.status(409).json({
					success: false,
					message: '등록된 값이랑 똑같아요',
				});
			}
			if (selectedComment.userId === res.locals.user.id) {
				await Comments.update(
					{
						content: content,
					},
					{
						where: {
							commentId: commentId,
						},
					},
				);
				res.redirect(`/api/post/${selectedComment.postId}`);
			}
		} catch (err) {
			console.log(err);
		}
	},
);
// //  U Update

// D delete
// 미들웨어로 검증 후 payload에 user[id] 추출
router.delete(
	'/comment/:commentId',
	authMiddleware,
	passwordValidator,
	async (req, res) => {
		const { commentId } = req.params;
		const { password } = req.body;
		const selectedComment = await Comments.findOne({
			where: {
				commentId: commentId,
			},
		});
		const checkedPaswword = await Users.findOne({
			where: {
				id: selectedComment.userId,
			},
		});
		const isSame = await bcrypt.compare(
			password,
			checkedPaswword.password,
		);
		if (!isSame) {
			return res.render('blank', {
				message: '입력하신 비밀번호가 올바르지 않습니다.',
			});
		}

		if (!selectedComment) {
			// 404 not found
			return res.status(404).json({
				success: false,
				message: '선택한 댓글이 존재하지 않습니다',
			});
		}
		const deletedComment = selectedComment;
		if (selectedComment.userId === res.locals.user.id) {
			selectedComment.destroy();
			return res.redirect(`/api/post/${selectedComment.postId}`);
		} else {
			// 403 Forbidden  권한이 없을 때 사용
			return res.status(403).json({
				success: false,
				message: 'payload의 id와 선택한 댓글 userId가 다릅니다',
			});
		}
	},
);
// // D delete

module.exports = router;
