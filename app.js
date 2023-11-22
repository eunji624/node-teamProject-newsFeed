require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');

const PORT = process.env.PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const UsersRouter = require('./routers/users.router.js');
const PostsRouter = require('./routers/posts.router.js');
const CommentsRouter = require('./routers/comment.router.js');

app.use('/api', UsersRouter);
app.use('/api', PostsRouter);
app.use('/api', CommentsRouter);

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
