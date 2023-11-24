require('dotenv').config();

const jwt = require('jsonwebtoken');
const { Users } = require('../models');

const authMiddleware = async (req, res, next) => {
	console.log('어쓰 통과');
	try {
		const { Authorization } = req.cookies;
		const [tokenType, tokenValue] = (Authorization ?? '').split(' ');
		if (tokenType !== 'Bearer' || !tokenValue) {
			return res
				.status(400)
				.json({ success: false, message: '다시 로그인 해주세요.' });
		}
		const checkJwt = jwt.verify(tokenValue, process.env.SECRET_KEY);
		const userData = await Users.findOne({
			where: { id: checkJwt.userId },
		});
		res.locals.user = userData;
		// res.cookies.id = checkJwt.userId;
		next();
	} catch (err) {
		if (err.name === 'TokenExpiredError') {
			return res
				.status(419)
				.json({ code: 419, message: '토큰이 만료되었습니다' });
		} else if (err.name === 'JsonWebTokenError') {
			return res.status(401).json({
				code: 401,
				message: '유효하지 않은 토큰입니다.',
			});
		} else {
			return res.status(401).send({
				errorMessage: '로그인 후 이용 가능한 기능입니다.',
			});
		}
	}
};

module.exports = { authMiddleware };
