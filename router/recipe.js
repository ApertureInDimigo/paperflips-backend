"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var util_1 = require("util");
router.get('/data/:seq', function (req, res) {
    if (util_1.isUndefined(req.params.seq))
        console.log('undefined');
    console.log('recipe get');
    connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\'' + req.params.seq + '\'', function (error, rows) {
        if (error)
            console.log(error);
        console.log('recipe info is: ', rows);
        try {
            var obj = JSON.stringify(rows);
            var obj2 = JSON.parse(obj.substring(1, obj.length - 2) + "," + "\"status\": 200}");
            res.send(obj2);
        }
        catch (e) {
            res.send(JSON.parse('{\"status\" : 404}'));
            '{\"status\" : 404}';
        }
    });
});
module.exports = router;
