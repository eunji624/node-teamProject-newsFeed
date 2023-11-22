require('dotenv').config();

const jwt = require('jsonwebtoken');
const { Users } = require('../models');

const authMiddleware = async (req, res, next) => {
	try {
		const [tokenType, tokenValue] =
			req.headers.authorization.split(' ');
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
		next();
	} catch (err) {
		console.log(err);
	}
};

module.exports = { authMiddleware };
