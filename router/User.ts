let express = require('express')  
let router = express.Router();

const crypto = require('crypto'); //암호화 모듈 

let jwt = require('jsonwebtoken'); //JWT 모듈
let secretObj = require('../config/jwt.ts'); //jwt 비밀키 

const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
const moment:any = require('moment')

require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");




let connection:any = mysql.createConnection(dbconfig); //mysql 연결

import {stat} from '../HTTP_req';
import {isAdmin} from '../admin' //admin 판단을 위함 
import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util'; 
import { check, check_id, check_name, check_pwd } from '../checker' //정규식 체크


/////////////////////////////// sql connect check를 위한 함수
function checkconnect() {
  connection.on('error', function(err:any) {
    console.log('db error', err);
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      connection = mysql.createConnection(dbconfig);                      
    } else {                                    
      throw err;                              
    }
  });
}



/////////////      Admin 권한               ////////////////

///////////////모든 유저 정보를 가져옴
router.get('/users', (req:any, res:any) => {
  checkconnect();
  let cookie = req.headers.cookie;  //쿠키 가져오기 

  if(!isUndefined(cookie)) { //undefined가 아닐때..
    let token = cookie.substring(5, cookie.length);

  try {
  let decode = jwt.verify(token, secretObj.secret); //토큰 검증
  let isAdmin:boolean = decode.admin; //관리자 여부

  if(isAdmin) { //관리자 일때.. 정상 프로세스
  connection.query('SELECT id, name, password, intro, favorite, deleted_day from Users', (error:any, rows:any) => {
    if (error) console.log(error);
    
    let rowstr:string = JSON.stringify(rows);
    res.send(JSON.parse(`[${rowstr.substring(1 , rowstr.length-1)}]`));
  });
}else { //관리자 일때.. 권한 없음 
  res.send(stat.get(403))
} 
  }catch (e) {
    res.send(stat.get(404))
  }
} else res.send(stat.get(404))



   });

/////////////      User  권한               ////////////////

//////////////컬렉션 레시피들 가져오기

router.get('/GetCollection', (req:any, res:any) => {
  let cookie = req.headers.cookie
   let token = cookie.substring(5, cookie.length);

   try{
     let decode = jwt.verify(token, secretObj.secret)
     if(check_id(decode.id)) {
       let id:string = decode.id;
      
       checkconnect();
       connection.query(`SELECT rec.seq ,rec.recipeName, rec.rarity, rec.summary, c.Date FROM Recipe AS rec JOIN Collection AS c ON c.rec_num = rec.seq AND c.id = '${id}'`, (error:any, rows:any) => {
        if (error) console.log(error);
         
        try{
         let obj:string = JSON.stringify(rows);
         console.log(`{ "data" : { ${obj.substring(1, obj.length - 2)} }, "status" : 200}`);
         
         let obj2:any = JSON.parse(`{ "data" : [ ${obj.substring(1, obj.length - 1)}] , "status" : 200}`);
         
         
         res.send(obj2);
        } catch(e) {
          console.log(e);
         res.send(stat.get(404));
       }
       
   
        
      }
      
      
      );
     }
       
     
   }catch (e) {
     res.send(stat.get(404));
   }
})

////////////////컬렉션 추가

router.post('/AddCollection/:cId', (req:any, res:any) => {
  console.log(req.params.cId);
  if(check(req.params.cId)) {
    let Addobject = req.params.cId;
    let cookie = req.headers.cookie;
    let token = cookie.substring(5, cookie.length);

    try{
      let decode = jwt.verify(token, secretObj.secret);
      if(check_id(decode.id)) {
        let id:string = decode.id;

       checkconnect();
       connection.query(`SELECT * FROM Collection WHERE id='${id}' AND rec_num=${Addobject}`, (error:any, rows:any) => {        
         console.log(rows.length);
         let a = rows;
        
         if(rows.length != 0) res.send(stat.get(404));
         else {
           try{
            checkconnect();
            connection.query(`INSERT INTO Collection (id, rec_num, Date) VALUES ('${id}', ${Addobject}, '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (error:any, rows:any) => {
              if(error) {
                console.log(error);
                res.send(stat.get(404));
              } else res.send(stat.get(200));
            })
           }catch(e) {
             res.send(stat.get(404));
           }
         }
       })


        
      }
    }catch(e) {
      res.send(stat.get(404))
    }
  } else {
    res.send(stat.get(404));
  }
})




/////////////// 회원 가입 
   router.post('/Adduser',(req:any, res:any) => {

    //////////////////////id, password, name 필드 
    let id:string = req.body.id;
    let pwd:string = req.body.password;
    let name:string = req.body.name;
    
    ///////////정규식 체크(SQL Injection 방지)
    if(check_id(id) && check_pwd(pwd) && check_name(name) ) {
    
      //32바이트의 랜덤 문자열 생성(salt)
      crypto.randomBytes(32, (err:any, buf:Buffer) => {
        //salt를 이용한 pwd 암호화
         crypto.pbkdf2(pwd , buf.toString('base64'), 126117, 64, 'sha512', (err:any, key:any) => {
           let pwd:string = key.toString('base64'); //암호화한 pwd 
           let salt:string = buf.toString('base64'); //랜덤 문자열 salt

           log('POST USERS id : ' + id +' pwd : ' + pwd + ' name : '+ name, 'default');

    let data = [id, pwd, name, salt];
    let sql:string = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';

  checkconnect(); //연결 설정 
 connection.query(sql, data,(err:any, results:any) => {
   if(err) {
     res.send(stat.get(404))
     console.log(err);
   }
   else res.send(stat.get(200))
     });


         });
       });
    }
    else {
      res.send(stat.get(404))
    }
   
});   

///////////유저 검색 Deprecation
router.get('/SearchUser/:id', (req:any, res:any) => {

     if(check_id(req.params.id)) {
   checkconnect();

   connection.query('SELECT id,name,intro,favorite,deleted_day from Users WHERE id="' + req.params.id + '"', (error:any, rows:any) => {
     if (error) console.log(error);

     
    
     try{
      let obj:string = JSON.stringify(rows);
      let obj2:any = JSON.parse(obj.substring(1, obj.length-2) + "," + "\"status\": 200}");
      res.send(obj2);
     } catch(e) {
      res.send(stat.get(404));
    }
    

     
   }
   
   
   );
  }
  else res.send(stat.get(404))
 });



 router.get('/GetMyInfo', (req:any, res:any) => {
   let cookie = req.headers.cookie
   let token = cookie.substring(5, cookie.length);

   try{
     let decode = jwt.verify(token, secretObj.secret)
     if(check_id(decode.id)) {
       let id:string = decode.id;
      
       checkconnect();
       connection.query('SELECT * from Users WHERE id="' + id + '"', (error:any, rows:any) => {
        if (error) console.log(error);
         
        try{
         let obj:string = JSON.stringify(rows);
         let obj2:any = JSON.parse(obj.substring(1, obj.length-2) + "," + "\"status\": 200}");
         res.send(obj2);
        } catch(e) {
         res.send(stat.get(404));
       }
       
   
        
      }
      
      
      );
     }
       
     
   }catch (e) {
     res.send(stat.get(404));
   }
 });

////////토큰 유효성 검사  deprecation 예정 
router.get('/check', (req:any, res:any) => {
  let token = req.headers.cookie;

  let decode = jwt.verify(token.substring(5, token.length), secretObj.secret);
  if(decode) {
    res.send(stat.get(200))
  } else {
    res.send(stat.get(404))
  }
})

/////////로그인, 토큰 반환 
 router.post('/login', (req:any, res:any) => {

      
    if(check_id(req.body.id) && check_pwd(req.body.password)) {



      

      checkconnect();
      connection.query(`SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id="`  + req.body.id + `"`, (error:any, rows:any) => {
      
  
        if(error)  res.send(stat.get(404));
  

        crypto.pbkdf2(req.body.password , rows[0].salt, 126117, 64, 'sha512', (err:any, key:any) => {
           
          console.log(key.toString('base64') == rows[0].password);
          console.log(key.toString('base64'));
          console.log(rows[0].password)
          if(key.toString('base64') == rows[0].password) {
            
            let token = jwt.sign(
              {
                id : req.body.id,
                admin : isAdmin(req.body.id),
              },
              secretObj.secret,
              {
                expiresIn: '30m'
              }
            )

            res.cookie("user", token);
            res.send(JSON.parse(`
            { "status" : 200,
             "data" : {
               "id" : "${req.body.id}",
               "name" : "${rows[0].name}",
               "intro" : "${rows[0].intro}",
               "favorite" : "${rows[0].favorite}",
               "deleted_day" : "${rows[0].deleted_day}"
             } 
            }
             `))
          } else {
            res.send(stat.get(404))
          }

          
          
        });
      })
    } else {
      res.send(stat.get(403));
    }
    
    
  }); 

 module.exports = router;