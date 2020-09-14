let express = require('express')  
let router = express.Router();

const crypto = require('crypto'); //암호화 모듈 

let jwt = require('jsonwebtoken'); //JWT 모듈
let secretObj = require('../config/jwt.ts'); //jwt 비밀키 

const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
const moment:any = require('moment')

let logs_ = require('../Bot/botplay');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

let connection:any = mysql.createConnection(dbconfig); //mysql 연결


import {isAdmin} from '../util/admin' //admin 판단을 위함 
import { check, check_id, check_name, check_pwd } from '../util/checker' //정규식 체크
import { isUndefined } from 'util';

router.use(function (req:any, res:any,next:any){
  connection.on('error', function(err:any) {
    if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      connection = mysql.createConnection(dbconfig);         
      next();             
    } else {
      next();                       
    }
    next();
  });
  next();
});

/////////////////////////////// sql connect check를 위한 함수

/////////////      Admin 권한               ////////////////

///////////////모든 유저 정보를 가져옴
router.get('/users', (req:any, res:any) => {
  let cookie = req.headers.cookie;  //쿠키 가져오기 

  let token;
  let decode;
  try{
    token = cookie.substring(5, cookie.length); //토큰 부분    user=<token> 형식
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
  }catch(err) {
     res.status(401).end()
  }
try {
  let isAdmin:boolean = decode.admin; //관리자 여부

  if(isAdmin) { //관리자 일때.. 정상 프로세스
  connection.query('SELECT id, name, password, intro, favorite, deleted_day from Users', (error:any, rows:any) => { //sql 쿼리
    if (error) { //에러 발생
      logs_(error);
      res.status(404).end();
      return;
    }

    let raw_data:string = JSON.stringify(rows); //가공 안된 데이터
    let data = JSON.parse(`[${raw_data.substring(1, raw_data.length-1)}]`) //json 배열 형태로 가공

    res.status(200).send(data); //데이터 전송
    return;

    });
    }else {
    res.status(403).end();
    return;
    } 
  }catch(e) {
    res.status(404).end();
  }
      
});

/////////////      User  권한               ////////////////

router.get('/GetCollection', (req:any, res:any) => { //컬렉션 레시피들 가져오기

  let cookie = req.headers.cookie
  let token


if(isUndefined(cookie)) {
  res.status(401).end()
} else {
  let decode;
    

    try{
      token = cookie.substring(5, cookie.length)
      decode = jwt.verify(token, secretObj.secret)
    }catch(err) {
      res.status(401).end()
      return;
    }

      
    try{
      if(!check_id(decode.id)) {
        res.status(404).end()
        return;
    }

     let id:string = decode.id;
    
     connection.query(`SELECT rec.seq ,rec.recipeName, rec.rarity, rec.summary,rec.path ,c.Date FROM Recipe AS rec JOIN Collection AS c ON c.rec_num = rec.seq AND c.id = '${id}'`, (error:any, rows:any) => {
        if (error) {
        logs_(error)
        res.status(404).end()
      }
       
      
       let raw_data:string = JSON.stringify(rows)
       let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}]}`);
       
       res.status(200).send(data);
    });
    }catch(e) {
      logs_(e);
      res.status(404).end()
    }


     
   
  }
})

////////////////컬렉션 추가

router.post('/AddCollection/:cId', (req:any, res:any) => {
  if(!check(req.params.cId)) {
    res.status(404).end()
  }
  let Recipe_seq = req.params.cId; //추가할 레시피 seq
  let cookie = req.headers.cookie; 
  console.log(isUndefined(cookie));
  
  if(isUndefined(cookie)) {
    res.status(401).end();
  } else {
    let decode;
    
    try{
      let token = cookie.substring(5, cookie.length);  
      decode =  jwt.verify(token, secretObj.secret);
    }catch(e) {
      res.status(401).end();
    }
      
      
      try{
      let id:string = decode.id;

      if(!check_id(id)) {
         res.status(404).end();
       }

       connection.query(`SELECT * FROM Collection WHERE id='${id}' AND rec_num=${Recipe_seq}`, (error:any, rows:any) => {
         if(rows.length != 0) {
           res.status(404).end();
         }
          connection.query(`INSERT INTO Collection (id, rec_num, Date) VALUES ('${id}', ${Recipe_seq}, '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (error:any, rows:any) => {
              if(error) {
                console.log(error);
                res.status(404).end();
              } 
              res.status(200).end();
            })
        })
     }catch(e) {
       logs_(e);
      res.status(404).end();
    }
  }
  
    
    
})




/////////////// 회원 가입 
router.post('/Adduser',(req:any, res:any) => {

    //////////////////////id, password, name 필드 
   let data = {
     id : req.body.id,
     pwd : req.body.password,
     name : req.body.name 
   }

    ///////////정규식 체크(SQL Injection 방지)
    if(!check_id(data.id) || !check_pwd(data.pwd) || !check_name(data.name) ) {
      res.status(404).end()
    }
    
      //32바이트의 랜덤 문자열 생성(salt)
      crypto.randomBytes(32, (err:any, buf:Buffer) => {
        //salt를 이용한 pwd 암호화
         crypto.pbkdf2(data.pwd , buf.toString('base64'), 126117, 64, 'sha512', (err:any, key:any) => {

           let en_pwd:string = key.toString('base64'); //암호화한 pwd 
           let salt:string = buf.toString('base64'); //랜덤 문자열 salt

           let into_data = [data.id, en_pwd, data.name, salt];
           let sql:string = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';

          connection.query(sql, into_data,(err:any, results:any) => {
            if(err) {
              res.status(404).end();
              logs_(err);
              }
            else {
              res.status(200).end();
              }
            });
         });
      });
});   

///////////유저 검색 Deprecation
router.get('/SearchUser/:id', (req:any, res:any) => {

     if(!check_id(req.params.id)) {
      res.status(404).end();       
      }

   connection.query('SELECT id,name,intro,favorite,deleted_day from Users WHERE id="' + req.params.id + '"', (error:any, rows:any) => {
     if (error) {
       logs_(error);
       res.status(404).end();
     }
     try{
      let raw_data:string = JSON.stringify(rows);
      let data:any = JSON.parse(raw_data.substring(1, raw_data.length-2) + "}");
      res.status(200).send(data);
     } catch(e) {
       console.log(e);
       logs_(e);
      res.status(404).end();
    }
   }
   );
 });



router.get('/GetMyInfo', (req:any, res:any) => {
  let cookie = req.headers.cookie
   
  if(isUndefined(cookie)) {
    res.status(401).end()
  } else {

    let token;
    let decode;

    try{
      token = cookie.substring(5, cookie.length);
      decode =  jwt.verify(token, secretObj.secret);
    }catch(e) {
      res.status(401).end();
      return;
    }

    try{
      if(!check_id(decode.id)) {
        res.status(404).end()
        return;
       }
 
        let id:string = decode.id;
        connection.query('SELECT * from Users WHERE id="' + id + '"', (error:any, rows:any) => {
         if (error) {
           logs_(error);
           res.status(404).end()
         }
          
         
          let raw_data:string = JSON.stringify(rows)
          let data:any = JSON.parse(raw_data.substring(1, raw_data.length-2) + "}")
          res.status(200).send(data)
       });
    }catch(e) {
       res.status(404).end();
       logs_(e);
       return;
    }
     
   
  }
 });

//////// 디코 봇 서버 상태 확인을 위함..
router.get('/check', (req:any, res:any) => {
  res.status(200).end();

})

/////////로그인, 토큰 반환 
 router.post('/login', (req:any, res:any) => {

      
    if(!check_id(req.body.id) || !check_pwd(req.body.password)) {
       res.status(404).end();
     }

try{
  connection.query(`SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id="`  + req.body.id + `"`, (error:any, rows:any) => {
    if(error) {
      logs_(error);
      res.status(404).end()
    }

    crypto.pbkdf2(req.body.password , rows[0].salt, 126117, 64, 'sha512', (err:any, key:any) => {
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

       let data = {
        id : req.body.id,
        name : rows[0].name,
        intro: rows[0].intro,
        favorite: rows[0].favorite,
        deleted_day: rows[0].deleted_day
       }

        res.cookie("user", token);

        res.status(200).send(data)
      } else {
        
        res.status(404).end()
      }
    });
  })
}catch(e) {
  logs_(e);
  res.status(404).end();
}
  }); 


 router.post('/NewRoom', (req:any, res:any) => {
   let cookie = req.headers.cookie;
   let token;
   let decode;
   try{
     token = cookie.substring(5, cookie.length);
     decode = jwt.verify(token, secretObj.secret);
   }catch(e) {
     res.status(401).end();
     return;
   }




   try {
     
   let input = {
    title : req.body.title,
    id : decode.id,
    date: moment().format('YYYY-MM-DD HH:mm:ss'),
    Data : JSON.stringify(req.body.data)
  }

     connection.query(`INSERT INTO RoomInfo (title, id, date, Data) VALUES ('${input.title}', '${input.id}', '${input.date}', '${input.Data}')`, (err:any, rows:any) => {
        if(err) {
          res.status(404).end();
          console.log(err);
          return;
        }

        res.status(200).end();
        return;
        console.log(rows);
     });
   }catch(e) {
     res.status(404).end();
     return;
   }
 })

 router.get('/myRoom', (req:any, res:any) => {
   let cookie = req.headers.cookie;
   let token;
   let decode;
   try{
     token = cookie.substring(5, cookie.length);
     decode = jwt.verify(token, secretObj.secret);
   } catch(e) {
     res.status(401).end()
     return;
   }
 
   try{

   
   connection.query(`SELECT seq, title, date, Data FROM RoomInfo WHERE id='${decode.id}'`, (err:any ,rows:any) => {
     if(err) {
       res.status(404).end();
       console.log(err);
       return;
     }

     if(rows.length == 0) {
       res.status(204).end();
       return;
     }
     
     
    for(let i = 0; i<rows.length; i++) {
      rows[i].Data = JSON.parse(rows[i].Data);
    }

     res.status(200).send(rows)
     return;
    
   })
  } catch(e) {
    logs_(e);
    res.status(404).end();
  }
 })

router.put('/RoomDataChange/:seq', (req:any, res:any) => {
  let cookie = req.headers.cookie;
  let token;
  let decode;
  try{
    token = cookie.substring(5, cookie.length);
    decode = jwt.verify(token, secretObj.secret);
  } catch(e) {
    res.status(401).end()
    return;
  }

  try{
     connection.query(`UPDATE RoomInfo SET Data='${JSON.stringify(req.body.Data)}' WHERE seq='${req.params.seq}'`);

     res.status(200).end();
     return;
  }catch(e) {
    logs_(e);
    res.status(404).end()
    return;
  }
  
})

  


 module.exports = router;