"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var fs = require('fs'); //파일 관리 모듈
var path = require('path'); //경로 모듈
var multer = require('multer'); //사진 모듈
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var util_1 = require("util");
var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "images/");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
var upload = multer({
    storage: storage
});
router.post('/upload', upload.single('img'), function (req, res) {
    var result = {
        originalname: req.file.originalname,
        size: req.file.size
    };
    console.log('success upload' + 'result is : ' + result);
    fs.rename('images/' + req.file.originalname, 'images/' + req.body.id + path.extname(req.file.originalname), function (err) {
        if (err)
            console.log(err);
        else
            console.log('success changename');
    });
    res.json(result);
});
router.get('/image/:id', function (req, res) {
    // log('GET USERS', 'default');
    if (util_1.isUndefined(req.params.id))
        console.log('Undefeind');
    console.log('image get');
    res.sendFile(req.params.id, { root: './images' });
});
module.exports = router;
