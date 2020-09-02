"use strict";
exports.__esModule = true;
var express = require('express');
var router = express.Router();
var crypto = require('crypto'); //암호화 모듈 
var jwt = require('jsonwebtoken'); //JWT 모듈
var secretObj = require('../config/jwt.ts'); //jwt 비밀키 
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
var connection = mysql.createConnection(dbconfig); //mysql 연결
var HTTP_req_1 = require("../HTTP_req");
var admin_1 = require("../admin"); //admin 판단을 위함 
var log_1 = require("../log/log"); //로그 임포트
var util_1 = require("util");
var checker_1 = require("../checker"); //정규식 체크
/////////////////////////////// sql connect check를 위한 함수
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
/////////////      Admin 권한               ////////////////
///////////////모든 유저 정보를 가져옴
router.get('/users', function (req, res) {
    checkconnect();
    var cookie = req.headers.cookie; //쿠키 가져오기 
    if (!util_1.isUndefined(cookie)) { //undefined가 아닐때..
        var token = cookie.substring(5, cookie.length);
        try {
            var decode = jwt.verify(token, secretObj.secret); //토큰 검증
            var isAdmin_1 = decode.admin; //관리자 여부
            if (isAdmin_1) { //관리자 일때.. 정상 프로세스
                connection.query('SELECT id, name, password, intro, favorite, deleted_day from Users', function (error, rows) {
                    if (error)
                        console.log(error);
                    var rowstr = JSON.stringify(rows);
                    res.send(JSON.parse("[" + rowstr.substring(1, rowstr.length - 1) + "]"));
                });
            }
            else { //관리자 일때.. 권한 없음 
                res.send(HTTP_req_1.stat.get(403));
            }
        }
        catch (e) {
            res.send(HTTP_req_1.stat.get(404));
        }
    }
    else
        res.send(HTTP_req_1.stat.get(404));
});
/////////////      User  권한               ////////////////
//////////////컬렉션 레시피들 가져오기
router.get('/GetCollection', function (req, res) {
    var cookie = req.headers.cookie;
    var token = cookie.substring(5, cookie.length);
    try {
        var decode = jwt.verify(token, secretObj.secret);
        if (checker_1.check_id(decode.id)) {
            var id = decode.id;
            checkconnect();
            connection.query("SELECT rec.seq ,rec.recipeName, rec.rarity, rec.summary, c.Date FROM Recipe AS rec JOIN Collection AS c ON c.rec_num = rec.seq AND c.id = '" + id + "'", function (error, rows) {
                if (error)
                    console.log(error);
                try {
                    var obj = JSON.stringify(rows);
                    console.log("{ \"data\" : { " + obj.substring(1, obj.length - 2) + " }, \"status\" : 200}");
                    var obj2 = JSON.parse("{ \"data\" : [ " + obj.substring(1, obj.length - 1) + "] , \"status\" : 200}");
                    res.send(obj2);
                }
                catch (e) {
                    console.log(e);
                    res.send(HTTP_req_1.stat.get(404));
                }
            });
        }
    }
    catch (e) {
        res.send(HTTP_req_1.stat.get(404));
    }
});
////////////////컬렉션 추가
router.post('/AddCollection/:cId', function (req, res) {
    console.log(req.params.cId);
    if (checker_1.check(req.params.cId)) {
        var Addobject_1 = req.params.cId;
        var cookie = req.headers.cookie;
        var token = cookie.substring(5, cookie.length);
        try {
            var decode = jwt.verify(token, secretObj.secret);
            if (checker_1.check_id(decode.id)) {
                var id_1 = decode.id;
                checkconnect();
                connection.query("SELECT * FROM Collection WHERE id='" + id_1 + "' AND rec_num=" + Addobject_1, function (error, rows) {
                    console.log(rows.length);
                    var a = rows;
                    if (rows.length != 0)
                        res.send(HTTP_req_1.stat.get(404));
                    else {
                        try {
                            checkconnect();
                            connection.query("INSERT INTO Collection (id, rec_num, Date) VALUES ('" + id_1 + "', " + Addobject_1 + ", '" + moment().format('YYYY-MM-DD HH:mm:ss') + "')", function (error, rows) {
                                if (error) {
                                    console.log(error);
                                    res.send(HTTP_req_1.stat.get(404));
                                }
                                else
                                    res.send(HTTP_req_1.stat.get(200));
                            });
                        }
                        catch (e) {
                            res.send(HTTP_req_1.stat.get(404));
                        }
                    }
                });
            }
        }
        catch (e) {
            res.send(HTTP_req_1.stat.get(404));
        }
    }
    else {
        res.send(HTTP_req_1.stat.get(404));
    }
});
/////////////// 회원 가입 
router.post('/Adduser', function (req, res) {
    //////////////////////id, password, name 필드 
    var id = req.body.id;
    var pwd = req.body.password;
    var name = req.body.name;
    ///////////정규식 체크(SQL Injection 방지)
    if (checker_1.check_id(id) && checker_1.check_pwd(pwd) && checker_1.check_name(name)) {
        //32바이트의 랜덤 문자열 생성(salt)
        crypto.randomBytes(32, function (err, buf) {
            //salt를 이용한 pwd 암호화
            crypto.pbkdf2(pwd, buf.toString('base64'), 126117, 64, 'sha512', function (err, key) {
                var pwd = key.toString('base64'); //암호화한 pwd 
                var salt = buf.toString('base64'); //랜덤 문자열 salt
                log_1.log('POST USERS id : ' + id + ' pwd : ' + pwd + ' name : ' + name, 'default');
                var data = [id, pwd, name, salt];
                var sql = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';
                checkconnect(); //연결 설정 
                connection.query(sql, data, function (err, results) {
                    if (err) {
                        res.send(HTTP_req_1.stat.get(404));
                        console.log(err);
                    }
                    else
                        res.send(HTTP_req_1.stat.get(200));
                });
            });
        });
    }
    else {
        res.send(HTTP_req_1.stat.get(404));
    }
});
///////////유저 검색 Deprecation
router.get('/SearchUser/:id', function (req, res) {
    if (checker_1.check_id(req.params.id)) {
        checkconnect();
        connection.query('SELECT id,name,intro,favorite,deleted_day from Users WHERE id="' + req.params.id + '"', function (error, rows) {
            if (error)
                console.log(error);
            try {
                var obj = JSON.stringify(rows);
                var obj2 = JSON.parse(obj.substring(1, obj.length - 2) + "," + "\"status\": 200}");
                res.send(obj2);
            }
            catch (e) {
                res.send(HTTP_req_1.stat.get(404));
            }
        });
    }
    else
        res.send(HTTP_req_1.stat.get(404));
});
router.get('/GetMyInfo', function (req, res) {
    var cookie = req.headers.cookie;
    var token = cookie.substring(5, cookie.length);
    try {
        var decode = jwt.verify(token, secretObj.secret);
        if (checker_1.check_id(decode.id)) {
            var id = decode.id;
            checkconnect();
            connection.query('SELECT * from Users WHERE id="' + id + '"', function (error, rows) {
                if (error)
                    console.log(error);
                try {
                    var obj = JSON.stringify(rows);
                    var obj2 = JSON.parse(obj.substring(1, obj.length - 2) + "," + "\"status\": 200}");
                    res.send(obj2);
                }
                catch (e) {
                    res.send(HTTP_req_1.stat.get(404));
                }
            });
        }
    }
    catch (e) {
        res.send(HTTP_req_1.stat.get(404));
    }
});
////////토큰 유효성 검사  deprecation 예정 
router.get('/check', function (req, res) {
    var token = req.headers.cookie;
    var decode = jwt.verify(token.substring(5, token.length), secretObj.secret);
    if (decode) {
        res.send(HTTP_req_1.stat.get(200));
    }
    else {
        res.send(HTTP_req_1.stat.get(404));
    }
});
/////////로그인, 토큰 반환 
router.post('/login', function (req, res) {
    if (checker_1.check_id(req.body.id) && checker_1.check_pwd(req.body.password)) {
        checkconnect();
        connection.query("SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id=\"" + req.body.id + "\"", function (error, rows) {
            if (error)
                res.send(HTTP_req_1.stat.get(404));
            crypto.pbkdf2(req.body.password, rows[0].salt, 126117, 64, 'sha512', function (err, key) {
                console.log(key.toString('base64') == rows[0].password);
                console.log(key.toString('base64'));
                console.log(rows[0].password);
                if (key.toString('base64') == rows[0].password) {
                    var token = jwt.sign({
                        id: req.body.id,
                        admin: admin_1.isAdmin(req.body.id)
                    }, secretObj.secret, {
                        expiresIn: '30m'
                    });
                    res.cookie("user", token);
                    res.send(JSON.parse("\n            { \"status\" : 200,\n             \"data\" : {\n               \"id\" : \"" + req.body.id + "\",\n               \"name\" : \"" + rows[0].name + "\",\n               \"intro\" : \"" + rows[0].intro + "\",\n               \"favorite\" : \"" + rows[0].favorite + "\",\n               \"deleted_day\" : \"" + rows[0].deleted_day + "\"\n             } \n            }\n             "));
                }
                else {
                    res.send(HTTP_req_1.stat.get(404));
                }
            });
        });
    }
    else {
        res.send(HTTP_req_1.stat.get(403));
    }
});
module.exports = router;
