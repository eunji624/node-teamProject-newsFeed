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
		try {
			await Comments.create({
				userId: res.locals.user.id,
				postId: postId,
				content,
			});
			return res.redirect(`/api/post/${postId}`);
		} catch (err) {
			return res.status(500).render('blank', {
				message:
					'댓글 등록에 실패하였습니다. 관리자에게 문의 하십시오',
			});
		}
	},
);

// C created

// R Read

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
			attributes: ['name', 'id'],
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
			return res.status(500).render('blank', {
				message: '관리자에게 문의 하십시오',
			});
		}
	}
});

// R Read

// U Update

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
			} else {
				return res.status(403).render('blank', {
					message: '댓글 수정에 실패했습니다.',
				});
			}
		} catch (err) {
			return res.status(500).render('blank', {
				message: '댓글 수정에 실패했습니다. 관리자에게 문의 하십시오',
			});
		}
	},
);

// //  U Update

// D delete

router.delete(
	'/comment/:commentId',
	authMiddleware,
	passwordValidator,
	async (req, res) => {
		try {
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
				return res.status(403).render('blank', {
					message: '입력하신 비밀번호가 올바르지 않습니다.',
				});
			}

			if (!selectedComment) {
				// 404 not found
				return res.status(404).render('blank', {
					message: '이미 삭제된 댓글입니다.',
				});
			}
			selectedComment;
			if (selectedComment.userId === res.locals.user.id) {
				selectedComment.destroy();
				return res.redirect(`/api/post/${selectedComment.postId}`);
			} else {
				// 403 Forbidden  권한이 없을 때 사용
				return res.status(403).render('blank', {
					message: '댓글 삭제에 실패했습니다',
				});
			}
		} catch {
			return res.status(500).render('blank', {
				message: '댓글 삭제에 실패했습니다. 관리자에게 문의 하십시오',
			});
		}
	},
);

// // D delete

module.exports = router;
