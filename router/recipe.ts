import * as express from 'express';
let router:express.Router = express.Router();

import * as jwt from 'jsonwebtoken';
import {secretObj} from '../config/jwt'
import * as mysql from 'mysql';

import {upload} from '../Image_Server/storage_handler'
import {dbconfig} from '../config/database'
let connection:mysql.Connection = mysql.createConnection(dbconfig); //mysql 연결
import {logs_} from '../Bot/botplay';

import * as path from 'path';
import {FileJSON, RecipeJSON, AllRecipeJSON, RecipeDetail} from '../interface';

import {S3_server} from '../Image_Server/S3_handler'


import {check_number, check_name} from '../util/checker'

router.use(function (req:express.Request, res:express.Response,next:express.NextFunction){   //SQL CONNECTION 체크를 위한 함수
  connection.on('error', function(err:mysql.MysqlError) {
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

//////////////////////////////레시피 데이터 
router.get('/data/:seq', (req:express.Request, res:express.Response) => {  
  let seq:string = req.params.seq;

    if(check_number(seq)) {
      try{
    connection.query(`SELECT recipeName,rarity,summary from Recipe WHERE seq='${seq}'`, (error:mysql.MysqlError, rows:any) => {
     if (error) {
       logs_(error.toString());
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
router.post('/Upload',upload.single('img'), (req:express.Request, res:express.Response) => { //파라미터로

  if(req.cookies === undefined) {
    res.send(401).end()
    return
  }  
  
  let host:string = 'https://paperflips.s3.amazonaws.com'
  let token:string;
  let decode:string|object;
  
  try{
    token = req.cookies.user; //토큰 부분    user=<token> 형식 cookie['user'] 형태로 받아오게 수정 예정 
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end() //토큰 관련 에러
     return;
  }

  
  try{
    if(JSON.parse(JSON.stringify(decode)).id) { //관리자만 접근 가능 
     res.status(403).end() //권한 없음 
     return;
    }else {
    
     let data:RecipeJSON = {     //업로드 데이터
       recipeName : req.body.recipeName,
       rarity: req.body.rarity,
       summary: req.body.summary
     }
   
      connection.query(`INSERT INTO Recipe (recipeName, rarity, summary) VALUES ('${data.recipeName}', '${data.rarity}', '${data.summary}'); 
                        SELECT LAST_INSERT_ID();
      `, (error:mysql.MysqlError, rows:any) => {
        if(error) { //sql error 발생.. connection.on으로 에러 핸들링 예정 
          logs_(error.toString());
          res.status(404).end()
          return;
        }
        let raw_data:string = JSON.stringify(rows);   //sql raw data
        let data:any = JSON.parse(raw_data); //JSON 형식으로 변경
        let seq:string = JSON.stringify(data[1][0]['LAST_INSERT_ID()']); //입력한 파일의 SEQ를 받아옴



        let result:FileJSON = { //업로드 파일 관련 메타데이터 
          originalname : req.file.originalname,
          size : req.file.size,
        }
          
       let image_server = new S3_server();
       image_server.recipe_upload(seq, result.originalname); //recipe_img 디렉토리에 파일을 업로드 함..
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

router.get('/Search', (req:express.Request, res:express.Response) => { //레시피 검색 기능  
  let recipe:any = req.query.q;

  if(!check_name(recipe)) {
    res.status(404).end() //SQL INJECTION 방지를 위한 정규식 체크
    return; 
  }
  try {
  connection.query(`SELECT seq, recipeName, rarity, summary from Recipe WHERE recipeName LIKE '%${recipe}%'`, (error:mysql.MysqlError, rows:any) => { //LIKE를 이용해 검색 
    if(error) { //에러 발생
      logs_(error.toString());
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




router.get('/AllData', (req:express.Request, res:express.Response) => {   //모든 레시피 데이터 가져오기 LIMIT 추가 예정.
  try{
    connection.query(`SELECT seq, recipeName,rarity,summary,path from Recipe`, (error:mysql.MysqlError, rows:any) => { //쿼리
      if (error) { // 에러
        logs_(error.toString())

        res.status(404).end() // 실패 
        return;
       }
       let raw_data:string = JSON.stringify(rows);
       let data:AllRecipeJSON= JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)} ], "length" : ${rows.length}}`);//데이터 가공

        res.status(200).send(data) // 성공
    });
  } catch(e) {
    logs_(e);
    res.status(404).end() //실패 , 에러
    return;
  }
  
})


router.post('/AddDetail/:recipeName', (req:express.Request, res:express.Response) => {

  if(req.cookies === undefined) {
    res.send(401).end()
    return
  }  


  let token:string;  
  let decode:string|object;

  try{
    token = req.cookies.user;
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end()
     return;
  }
  
  if(JSON.parse(JSON.stringify(decode)).admin) {
    res.status(403).end()
    return;
  }

   try{
     let data:RecipeDetail = {
       recipeName:req.params.recipeName,
       detail:req.body.detail,
       VidPath:req.body.VidPath,
       ImgPath:req.body.ImgPath
     }
     connection.query(`INSERT INTO Recipe_Detail (recipeName, detail, VidPath, ImgPath) 
     VALUES ('${data.recipeName}', '${data.detail}', '${data.VidPath}', '${data.ImgPath}')`)
     res.status(200).end();
   
   }catch(e) {
       logs_(e);
       res.status(404).end()
       return;
   }
})

router.get('/GetDetail/:recipeName', (req:express.Request, res:express.Response) => {
  try{
connection.query(`SELECT * FROM Recipe_Detail WHERE recipeName='${req.params.recipeName}'` ,(error:mysql.MysqlError, rows:any) => {
  res.status(200).send(rows[0]);
  return;
})
  }catch(e) {
    logs_(e);
    res.status(404).end();
  }
})

 module.exports = router;