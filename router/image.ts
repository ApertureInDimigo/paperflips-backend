let express = require('express');
let router = express.Router();

let fs:any = require('fs') //파일 관리 모듈
const path = require('path') //경로 모듈
const multer = require('multer'); //사진 모듈
const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
const connection:any = mysql.createConnection(dbconfig); //mysql 연결

import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util';

let storage:any = multer.diskStorage({
    destination: function(req:any, file:any, callback:any) {
      callback(null, "images/")
    },
    filename (req:any, file:any, callback:any) {
      callback(null, file.originalname)
  }
  })
  
  
  
  let upload:any = multer(
    {
      storage:storage
    }
  )

router.post('/upload', upload.single('img'), (req:any,res:any) => {
           
    let result = {
      originalname : req.file.originalname,
      size : req.file.size,
    }
    console.log('success upload' + 'result is : ' + result)    
    fs.rename('images/' + req.file.originalname, 'images/'+ req.body.id + path.extname(req.file.originalname), function(err : any) {
      if (err) console.log(err);
      else console.log('success changename')
    })  
    res.json(result)
  })


  router.get('/image/:id', (req:any, res:any) => {
   // log('GET USERS', 'default');
   if(isUndefined(req.params.id)) console.log('Undefeind');

   console.log('image get');  
   res.sendFile(req.params.id, { root: './images' });
   });

   module.exports = router;