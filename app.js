const express = require('express');
//const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//const router = express.Router();

const app = express();

module.exports = app;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.post('/', function(req, res, next) {
    res.json(req.body);
});
