const express = require('express');
const { authMiddleware } = require('../middleware/auth.js');
const router = express.Router();
const { Posts, Users, Comments } = require('../models');
const {
	commentValidator,
	commentSameWriterValidator,
} = require('../middleware/validator.js');
require('dotenv').config();
// 리프레시토큰 보통2주?!
// 엑세스토큰 1시간
// 1. 로그인성공시 R A 같이 발급
// 2. R이 DB쪽에 저장
// CRUD

// findOne 보다 findByPk
// C created
// 1.미들웨어로 검증 후 payload에 user[id] 추출
// 2.입력값 유효성 검사
// 3./comment/(Posts):id PostID가져와서 같이 created
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
		res.json({ success: true, Commnets: createdProduct });
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
			'petName',
			'createdAt',
		],
	});
	const commentsList = await Comments.findAll({
		where: { postId: postId },
		attributes: ['content', 'commentId', 'updatedAt'],
		include: {
			model: Users,
			as: 'User',
			attributes: ['name'],
		},
		order: [['updatedAt', 'DESC']],
	});
	// console.log(commentsList);
	res.render('postDetail', { postsDetail, commentsList });
	// res.send({ success: true, postsDetail, commentsList });
});
// R Read

// //  U Update

router.put(
	'/comment/:commentId',
	authMiddleware,
	commentValidator,
	commentSameWriterValidator,
	async (req, res) => {
		const { commentId } = req.params;
		const selectedComment = await Comments.findOne({
			where: {
				commentId: commentId,
			},
		});

		let { content } = req.body;
		// if (!content) {
		// 	return res
		// 		.status(400)
		// 		.json({ success: false, message: '값을 입력하시오' });
		// }
		if (content === selectedComment.content) {
			// 409 Conflict  값들끼리 충돌 날 때
			return res
				.status(409)
				.json({ success: false, message: '등록된 값이랑 똑같아요' });
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
			const updatedComment = await Comments.findOne({
				where: {
					commentId: commentId,
				},
			});
			res.status(200).json({
				success: true,
				message: '댓글이 성공적으로 수정됬습니다',
				updatedComment,
			});
		}
		// else {
		// 	return res.status(403).json({
		// 		success: false,
		// 		message: 'payload의 id와 선택한 댓글 userId가 다릅니다',
		// 	});
		// }
	},
);
// //  U Update

// D delete
// 미들웨어로 검증 후 payload에 user[id] 추출
router.delete(
	'/comment/:commentId',
	authMiddleware,
	commentSameWriterValidator,
	async (req, res) => {
		const { commentId } = req.params;
		const selectedComment = await Comments.findOne({
			where: {
				commentId: commentId,
			},
		});
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
			return res.status(200).json({
				success: true,
				message: '삭제가 성공적으로 이루어졌습니다',
				deletedComment,
			});
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
