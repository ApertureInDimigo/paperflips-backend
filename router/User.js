"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var log_1 = require("../log/log"); //로그 임포트
var checker_1 = require("../checker");
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
    connection.query('SELECT id, name, password, intro, favorite, deleted_day from Users', function (error, rows) {
        if (error)
            console.log(error);
        res.send(rows);
    });
});
router.post('/Adduser', function (req, res) {
    var id = req.body.id;
    var pwd = req.body.password;
    var name = req.body.name;
    if (checker_1.check_id(id) && checker_1.check_pwd(pwd) && checker_1.check_name(name)) {
        crypto.randomBytes(32, function (err, buf) {
            crypto.pbkdf2(pwd, buf.toString('base64'), 126117, 64, 'sha512', function (err, key) {
                var pwd = key.toString('base64');
                var salt = buf.toString('base64');
                log_1.log('POST USERS id : ' + id + ' pwd : ' + pwd + ' name : ' + name, 'default');
                var data = [id, pwd, name, salt];
                var sql = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';
                checkconnect();
                connection.query(sql, data, function (err, results) {
                    if (err)
                        console.log(err);
                    res.send(JSON.parse('{\"status\":200}'));
                });
            });
        });
    }
    else {
        res.send(JSON.parse('{\"status\":404}'));
    }
});
router.get('/SearchUser/:id', function (req, res) {
    checkconnect();
    if (checker_1.check_id(req.params.id)) {
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
    if (checker_1.check_id(req.body.id) && checker_1.check_pwd(req.body.password)) {
        connection.query("SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id=\"" + req.body.id + "\"", function (error, rows) {
            if (error)
                res.send(JSON.parse("{ \"status\" : 404}"));
            crypto.pbkdf2(req.body.password, rows[0].salt, 126117, 64, 'sha512', function (err, key) {
                if (key.toString('base64') == rows[0].password) {
                    res.send(JSON.parse("\n            { \"status\" : 200,\n             \"data\" : {\n               \"id\" : \"" + req.body.id + "\",\n               \"name\" : \"" + rows[0].name + "\",\n               \"intro\" : \"" + rows[0].intro + "\",\n               \"favorite\" : \"" + rows[0].favorite + "\",\n               \"deleted_day\" : \"" + rows[0].deleted_day + "\"\n             } \n            }\n             "));
                }
                else {
                    res.send(JSON.parse("{ \"status\" : 404}"));
                }
            });
        });
    }
    else {
        res.send(JSON.parse("{ \"status\" : 403}"));
    }
});
module.exports = router;
