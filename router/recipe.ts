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
import { isAdmin } from '../util/admin';

router.use(function (req:any, res:any,next:any){   //SQL CONNECTION 체크를 위한 함수
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

let storage:any = multer.diskStorage({ //레시피 이미지 업로드를 위한 multer 설정 
  destination: function(req:any, file:any, callback:any) {
    callback(null, "images/") //파일 경로
  },
  filename (req:any, file:any, callback:any) {
    callback(null, file.originalname)
} //파일 이름 
})



let upload:any = multer( //업로드 객체 
  {
    storage:storage
  }
)

function upload_to_server(locate:string, fname:string) { //업로드를 위함
  let param = {
    'Bucket':'paperflips', //버킷 이름
    'Key': locate + '/' + fname, //저장할 파일 이름 
    'ACL':'public-read', //권한, 공개 읽기
    'Body': fs.createReadStream('./images/' + fname), //읽어올 곳 
    'ContentType':'image/png'  //파일 형식 
  } 
  
  s3.putObject(param, function(err:any, data:any) { //에러 핸들링 추가 예정 
      console.log(err);
      console.log(data);
  })
}
//////////////////////////////레시피 데이터 
router.get('/data/:seq', (req:any, res:any) => {  
  let seq:number = req.params.seq;

    if(check(seq.toString())) {

      try{
    connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\''+req.params.seq + '\'', (error:any, rows:any) => {
     if (error) {
       logs_(error);
       res.status(404).end();
       return;
      }
       let obj:string = JSON.stringify(rows);
       let obj2:any = JSON.parse("{" + "\"data\":" + obj.substring(1, obj.length - 1) + "}");
     
       res.status(200).send(obj2);
       return;
     
   });
  } catch(e) {
    logs_(e);
    res.status(404).end()
    return;
 }
  }else {
    res.status(404).end();
    return;
  }

 });
//////////// 운영자 권한 
router.post('/Upload',upload.single('img'), (req:any, res:any) => { //파라미터로

  let cookie = req.headers.cookie;  //쿠키 가져오기 
  let host:string = 'https://paperflips.s3.amazonaws.com'
  let token;
  let decode;
  try{
    token = cookie.substring(5, cookie.length); //토큰 부분    user=<token> 형식 cookie['user'] 형태로 받아오게 수정 예정 
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end() //토큰 관련 에러
     return;
  }

  try{
    if(!isAdmin(decode.id)) { //관리자만 접근 가능 
     res.status(403).end() //권한 없음 
     return;
    }else {

     let data = {     //업로드 데이터
       recipeName: req.body.recipeName,
       rarity: req.body.rarity,
       summary: req.body.summary
     }
   
      connection.query(`INSERT INTO Recipe (recipeName, rarity, summary) VALUES ('${data.recipeName}', '${data.rarity}', '${data.summary}'); 
                        SELECT LAST_INSERT_ID();
      `, (error:any, rows:any) => {
        if(error) { //sql error 발생.. connection.on으로 에러 핸들링 예정 
          logs_(error);
          res.status(404).end()
          return;
        }
        let raw_data:string = JSON.stringify(rows);   //sql raw data
        let data = JSON.parse(raw_data); //JSON 형식으로 변경
        let seq:string = JSON.stringify(data[1][0]['LAST_INSERT_ID()']); //입력한 파일의 SEQ를 받아옴



        let result = { //업로드 파일 관련 메타데이터 
          originalname : req.file.originalname,
          size : req.file.size,
        }
        
        let fname:string = seq + path.extname(result.originalname); //파일 이름 설정
        fs.rename('images/' + req.file.originalname, 'images/'+ seq + path.extname(req.file.originalname), function(err : any) {
            if(err) {
              res.status(404).end(); //에러 발생 
              return;
            }
        })  
        
       upload_to_server('recipe_img', fname); //recipe_img 디렉토리에 파일을 업로드 함..
       connection.query(`UPDATE Recipe SET path='${host}/recipe_img/${seq}${path.extname(req.file.originalname)}'`); //업로드 한 파일의 s3 경로를 받아옴 
       res.status(200).end(); //성공 
       return;
      })
  
     
       
    }


  }catch(e) {
    logs_(e);
    res.status(404).end() //에러 발생 
    return;
  }

  

  


})



router.get('/Search', (req:any, res:any) => { //레시피 검색 기능  
  let recipe:string = req.query.q;

  if(!check_name(recipe)) {
    res.status(404).end() //SQL INJECTION 방지를 위한 정규식 체크
    return; 
  }
  try {
  connection.query(`SELECT seq, recipeName, rarity, summary from Recipe WHERE recipeName LIKE '%${recipe}%'`, (error:any, rows:any) => { //LIKE를 이용해 검색 
    if(error) { //에러 발생
      logs_(error);
      res.status(404).end() //404
      return;
    }
      if(rows.length == 0) {
        res.status(404).end() //404
        return;
      } 
      let raw_data:string = JSON.stringify(rows);
      let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}] , "length" : ${rows.length}}`); //데이터 가공 
      res.status(200).send(data)
      return
  })
 }catch (e) {
   logs_(e);
   res.status(404).end(); // 실패, 에러 
   return
 }
}
)




router.get('/AllData', (req:any, res:any) => {   //모든 레시피 데이터 가져오기 LIMIT 추가 예정.

  try{
    connection.query('SELECT seq, recipeName,rarity,summary,path from Recipe', (error:any, rows:any) => { //쿼리
      if (error) { // 에러
        logs_(error)

        res.status(404).end() // 실패 
        return;
       }
       let raw_data:string = JSON.stringify(rows);
       let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)} ], "length" : ${rows.length}}`);//데이터 가공

        res.status(200).send(data) // 성공
    });
  } catch(e) {
    logs_(e);
    res.status(404).end() //실패 , 에러
    return;
  }
  
})


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
    logs_(e);
    res.status(404).end();
  }
})

 module.exports = router;