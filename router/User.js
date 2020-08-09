"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var log_1 = require("../log/log"); //로그 임포트
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
router.get('/users', function (req, res) {
    checkconnect();
    log_1.log('GET USERS', 'default');
    connection.query('SELECT * from Users', function (error, rows) {
        if (error)
            console.log(error);
        console.log('User info is: ', rows);
        res.send(rows);
    });
});
router.post('/Adduser', function (req, res) {
    if (req.body.id == '' || req.body.password == '' || req.body.name == '') {
        console.log('Undefined detected');
        res.send(JSON.stringify({ "status": 404, "error": 1 }));
    }
    else {
        checkconnect();
        log_1.log('POST USERS id : ' + req.body.id + ' pwd : ' + req.body.password + ' name : ' + req.body.name, 'default');
        var data = [req.body.id, req.body.password, req.body.name];
        var sql = 'INSERT INTO Users (id, password, name) VALUES(?, ?, ?)';
        var query = connection.query(sql, data, function (err, results) {
            if (err)
                console.log(err);
            res.send(JSON.stringify({ "status": 200, "error": null, "response": results }));
        });
    }
});
router.get('/SearchUser/:id', function (req, res) {
    checkconnect();
    var check = /^[A-Z0-9a-z]$/.test(req.params.id);
    if (check) {
        connection.query('SELECT * from Users WHERE id="' + req.params.id + '"', function (error, rows) {
            if (error)
                console.log(error);
            try {
                var obj = JSON.stringify(rows);
                var obj2 = JSON.parse(obj.substring(1, obj.length - 2) + "," + "\"status\": 200}");
                res.send(obj2);
            }
            catch (e) {
                res.send(JSON.stringify({ "status": 404 }));
            }
        });
    }
    else
        res.send(JSON.stringify({ "status": 404 }));
});
router.post('/login', function (req, res) {
    checkconnect();
    connection.query('SELECT password from Users WHERE id="' + req.body.id + '"', function (error, rows) {
        var a = 1; //정상 처리 확인 코드
        var e = ""; //error 코드 
        if (error) { //sql error 발생
            console.log(error);
            a = 0;
            e = "sql error";
        }
        else if (util_1.isUndefined(req.body.password)) { //password값이 전송 되지 않았을때...
            a = 0;
            e = "password undefined";
        }
        else if (rows[0].password != req.body.password) {
            a = 0;
            e = "unmatch error";
        }
        else {
            a = 1;
        }
        console.log(e);
        log_1.log((!e ? "success" : "failed ") + " " + req.body.id + " ", !e ? 'default' : 'error');
        //if(e) {
        //  log(a == 1 ? "success" : "failed" + " " + req.body.id + " " + e, a == 1 ? 'default' : 'error');
        //} else {
        //  log(a == 1 ? "success" : "failed" + " " + req.body.id + " " + e, a == 1 ? 'default' : 'error');
        //}
        res.send(JSON.stringify({ "success": a.toString() }));
    });
});
module.exports = router;
