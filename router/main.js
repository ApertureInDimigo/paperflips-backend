"use strict";
exports.__esModule = true;
var mysql = require('mysql'); //mysql 모듈
var dbconfig = require('../config/database.ts'); //database 구조
var connection = mysql.createConnection(dbconfig); //mysql 연결
var fs = require('fs'); //파일 관리 모듈
var path = require('path'); //경로 모듈
var multer = require('multer'); //사진 모듈
var UserRouter = require('./User');
var ImageRouter = require('./image');
var recipeRouter = require('./recipe');
//const upload:any = multer({dest: 'images/'})
module.exports = function (app) {
    app.use('/User', UserRouter);
    app.use('/img', ImageRouter);
    app.use('/rec', recipeRouter);
    //restful API 구현부
    app.get('/recipe_step', function (req, res) {
        connection.query('SELECT * from recipe_step_info', function (error, rows) {
            if (error)
                console.log(error);
            console.log('User info is: ', rows);
            res.send(rows);
        });
    });
    app.get('/recipe_board', function (req, res) {
        connection.query('SELECT * from recipe_board', function (error, rows) {
            if (error)
                console.log(error);
            console.log('User info is: ', rows);
            res.send(rows);
        });
    });
    app.get('/community_board', function (req, res) {
        connection.query('SELECT * from community_board', function (error, rows) {
            if (error)
                console.log(error);
            console.log('User info is: ', rows);
            res.send(rows);
        });
    });
    app.get('/logs', function (req, res) {
        connection.query('SELECT * from logs', function (error, rows) {
            if (error)
                console.log(error);
            console.log('User info is: ', rows);
            res.send(rows);
        });
    });
    /*
     app.get('/',function(req:any,res:any){
        res.render('index.html')
     });
     */
};
