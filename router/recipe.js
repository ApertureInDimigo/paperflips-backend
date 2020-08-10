"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var checker_1 = require("../checker");
var util_1 = require("util");
function checkconnect() {
    connection.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connection = mysql.createConnection(dbconfig);
        }
        else {
            throw err;
        }
    });
}
router.get('/data/:seq', function (req, res) {
    if (!checker_1.check(req.params.seq)) {
        if (util_1.isUndefined(req.params.seq))
            console.log('undefined');
        checkconnect();
        console.log('recipe get');
        var seq = req.params.seq;
        if (checker_1.check(seq.toString())) {
            connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\'' + req.params.seq + '\'', function (error, rows) {
                if (error) {
                    console.log(error);
                    // res.send(JSON.parse('{\"status\" : 404}'));
                }
                console.log('recipe info is: ', rows);
                try {
                    var obj = JSON.stringify(rows);
                    // let obj2:any = JSON.parse( "{" + obj + "," + "\"status\": 200}");
                    var obj2 = JSON.parse("{" + "\"data\":" + obj.substring(1, obj.length - 1) + "," + "\"status\": 200" + "}");
                    res.send(obj2);
                    //  res.send(obj2);
                }
                catch (e) {
                    console.log(e);
                    res.send(JSON.parse('{\"status\" : 404}'));
                }
            });
        }
        else {
            res.send(JSON.parse('{\"status\" : 404}'));
        }
    }
    else {
        res.send(JSON.parse('{\"status\" : 404}'));
    }
});
module.exports = router;
