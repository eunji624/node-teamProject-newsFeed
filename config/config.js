'use strict';

import dotenv from 'dotenv';
dotenv.config();

const env = process.env;

const development = {
	username: env.DB_NAME,
	password: env.DB_PASSWORD,
	database: env.DB_NAME,
	host: env.DB_HOST,
	dialect: 'mysql',
};
const test = {
	username: 'root',
	password: null,
	database: 'database_test',
	host: '127.0.0.1',
	dialect: 'mysql',
};
const production = {
	username: 'root',
	password: null,
	database: 'database_production',
	host: '127.0.0.1',
	dialect: 'mysql',
};

// module.exports = { development };
export { development };
