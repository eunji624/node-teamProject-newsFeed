const { query, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();

const registerValidator = (req, res, next) => {};

module.exports = { registerValidator };
