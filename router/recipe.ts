let express = require('express');
let router = express.Router();

let jwt = require('jsonwebtoken'); //JWT 모듈
let secretObj = require('../config/jwt.ts'); //jwt 비밀키
const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
let connection:any = mysql.createConnection(dbconfig); //mysql 연결
let logs_ = require('../Bot/botplay');
let fs:any = require('fs') //파일 관리 모듈
const path = require('path') //경로 모듈
const multer = require('multer'); //사진 모듈



let AWS = require('aws-sdk')
  
AWS.config.region = 'us-east-1'

let s3 = new AWS.S3();


import {check, check_name} from '../util/checker'
import { isUndefined } from 'util';
import { isAdmin } from '../util/admin';

router.use(function (req:any, res:any,next:any){
  connection.on('error', function(err:any) {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      connection = mysql.createConnection(dbconfig);         
      next();             
    } else {                    
      logs_("sql connection error")                
      res.status(404).end()                            
    }
    next();
  });
  next();
});

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

function upload_to_server(locate:string, fname:string) {
  let param = {
    'Bucket':'paperflips', //버킷 이름
    'Key': locate + '/' + fname, //저장할 파일 이름 
    'ACL':'public-read', //권한, 공개 읽기
    'Body': fs.createReadStream('./images/' + fname), //읽어올 곳 
    'ContentType':'image/png'  //파일 형식 
  } 
  
  s3.putObject(param, function(err:any, data:any) {
      console.log(err);
      console.log(data);
  })
}


router.post('/Upload',upload.single('img'), (req:any, res:any) => {

  let cookie = req.headers.cookie;  //쿠키 가져오기 
  console.log(cookie);
  let host:string = 'https://paperflips.s3.amazonaws.com'
  let token;
  let decode;
  try{
    console.log(token);
    token = cookie.substring(5, cookie.length); //토큰 부분    user=<token> 형식
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end()
     return;
  }

  try{
    if(!isAdmin(decode.id)) {
     res.status(403).end()
     return;
    }else {

     let data = {
       recipeName: req.body.recipeName,
       rarity: req.body.rarity,
       summary: req.body.summary
     }
   
      connection.query(`INSERT INTO Recipe (recipeName, rarity, summary) VALUES ('${data.recipeName}', '${data.rarity}', '${data.summary}'); 
                        SELECT LAST_INSERT_ID();
      `, (error:any, rows:any) => {
        if(error) {
          logs_(error);
          res.status(404).end()
          return;
        }
        let raw_data:string = JSON.stringify(rows);
        let data = JSON.parse(raw_data);
        let seq:string = JSON.stringify(data[1][0]['LAST_INSERT_ID()']);



        let result = {
          originalname : req.file.originalname,
          size : req.file.size,
        }
        
        let fname:string = seq + path.extname(result.originalname);
        fs.rename('images/' + req.file.originalname, 'images/'+ seq + path.extname(req.file.originalname), function(err : any) {
            
        })  
        
       upload_to_server('recipe_img', fname);
       connection.query(`UPDATE Recipe SET path='${host}/recipe_img/${seq}${path.extname(req.file.originalname)}'`);
       res.status(200).end();
       return;
      })
  
     
       
    }


  }catch(e) {
    logs_(e);
    res.status(404).end()
    return;
  }

  

  


})



router.get('/Search', (req:any, res:any) => {
  let recipe:string = req.query.q;

  if(!check_name(recipe)) {
    res.status(404).end()
    return;
  }
  try {
  connection.query(`SELECT seq, recipeName, rarity, summary from Recipe WHERE recipeName LIKE '%${recipe}%'`, (error:any, rows:any) => {
    if(error) {
      logs_(error);
      res.status(404).end()
      return;
    }
      if(rows.length == 0) {
        res.status(404).end()
        return;
      } 
      let raw_data:string = JSON.stringify(rows);
      let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}] , "length" : ${rows.length}}`);
      res.status(200).send(data)
      return
  })
 }catch (e) {
   logs_(e);
   res.status(404).end();
   return
 }
}
)




router.get('/AllData', (req:any, res:any) => {

  try{
    connection.query('SELECT seq, recipeName,rarity,summary,path from Recipe', (error:any, rows:any) => {
      if (error) {
        logs_(error)

        res.status(404).end()
        return;
       }
       let raw_data:string = JSON.stringify(rows);
       let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)} ], "length" : ${rows.length}}`);

        res.status(200).send(data)
    });
  } catch(e) {
    logs_(e);
    res.status(404).end()
    return;
  }
  
})


//////////////////////////////카드 데이터
router.get('/data/:seq', (req:any, res:any) => {  
  let seq:number = req.params.seq;

    if(check(seq.toString())) {

      try{
    connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\''+req.params.seq + '\'', (error:any, rows:any) => {
     if (error) {
       logs_(error);
       res.status(404).end();
      }
       let obj:string = JSON.stringify(rows);
       let obj2:any = JSON.parse("{" + "\"data\":" + obj.substring(1, obj.length - 1) + "}");
     
       res.status(200).send(obj2);
     
   });
  } catch(e) {
    logs_(e);
    res.status(404).end()
 }
  }else {
    res.status(404).end();
  }

 });

router.post('/AddDetail/:recipeName', (req:any, res:any) => {

  let cookie = req.headers.cookie;  //쿠키 가져오기 
  let token;
  let decode;
  try{
    token = cookie.substring(5, cookie.length); //토큰 부분    user=<token> 형식
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end()
     return;
  }
  
  if(!isAdmin(decode.id)) {
    res.status(403).end()
    return;
  }

   try{
     connection.query(`INSERT INTO Recipe_Detail (recipeName, detail, VidPath, ImgPath) 
     VALUES ('${req.params.recipeName}', '${req.body.detail}', '${req.body.VidPath}', '${req.body.ImgPath}')`)
     res.status(200).end();
   
   }catch(e) {
       logs_(e);
       res.status(404).end()
       return;
   }
})

router.get('/GetDetail/:recipeName', (req:any, res:any) => {
  try{
connection.query(`SELECT * FROM Recipe_Detail WHERE recipeName='${req.params.recipeName}'` ,(error:any, rows:any) => {
  res.status(200).send(rows[0]);
  return;
})
  }catch(e) {
    console.log(e);
    logs_(e);
    res.status(404).end();
  }
})

 module.exports = router;