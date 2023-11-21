import express from 'express';
// import { PORT } from './constants/app.constant';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT;
const app = express();

app.get('/', (req, res) => {
	res.send('Hello World!');
});

app.listen(PORT, () => {
	console.log(`Example app listening on port ${PORT}`);
});
