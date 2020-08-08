const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
const connection:any = mysql.createConnection(dbconfig); //mysql 연결
let fs:any = require('fs') //파일 관리 모듈
const path = require('path') //경로 모듈
const multer = require('multer'); //사진 모듈

import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util';
import { stringify } from 'querystring';




let UserRouter:any = require('./User')
let ImageRouter:any = require('./image')
let recipeRouter:any = require('./recipe')












//const upload:any = multer({dest: 'images/'})





module.exports = function(app:any)

{
      app.use('/User',UserRouter)
      app.use('/img', ImageRouter)
      app.use('/rec', recipeRouter)

      //restful API 구현부
      
      app.get('/recipe_step', (req:any, res:any) => {
        
        res.render('index.html')
      });

       app.get('/recipe_step', (req:any, res:any) => {
        connection.query('SELECT * from recipe_step_info', (error:any, rows:any) => {
          if (error) console.log(error);
          console.log('User info is: ', rows);
          res.send(rows);
        });
      });

      app.get('/recipe_board', (req:any, res:any) => {
        connection.query('SELECT * from recipe_board', (error:any, rows:any) => {
          if (error) console.log(error);
          console.log('User info is: ', rows);
          res.send(rows);
        });
      });

      app.get('/community_board', (req:any, res:any) => {
        connection.query('SELECT * from community_board', (error:any, rows:any) => {
          if (error) console.log(error);
          console.log('User info is: ', rows);
          res.send(rows);
        });
      });

      app.get('/logs', (req:any, res:any) => {
        connection.query('SELECT * from logs', (error:any, rows:any) => {
          if (error) console.log(error);
          console.log('User info is: ', rows);
          res.send(rows);
        });
      });

  
    
    /*
     app.get('/',function(req:any,res:any){
        res.render('index.html')
     });
     */
}
