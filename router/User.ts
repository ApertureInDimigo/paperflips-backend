
import * as express from 'express'

let router = express.Router();

import {CollectionJSON, CollectionJSONArray, loginJSON, registerJSON, RoomJSON, UserJSON} from '../interface'
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import {secretObj} from '../config/jwt' //jwt 비밀키

import * as mysql from 'mysql';      //mysql 모듈
import {dbconfig} from '../config/database';
const moment:any = require('moment')

import {logs_} from '../Bot/botplay';
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

let connection:mysql.Connection = mysql.createConnection(dbconfig); //mysql 연결


import {isAdmin} from '../util/admin' //admin 판단을 위함 
import { check_number, check_id, check_name, check_pwd } from '../util/checker' //정규식 체크

router.use(function (req:express.Request, res:express.Response,next:express.NextFunction){
  connection.on(`error`, function(err:mysql.MysqlError) {
    if(err.code === `PROTOCOL_CONNECTION_LOST`) {   
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
router.get(`/users`, (req:express.Request, res:express.Response) => {
  let isAdmin:boolean = false;
  let token:string;
  let decode:object|string;

  if(req.cookies === undefined) {
    res.send(401).end()
    return
  }
  try{
    token = req.cookies.user;
    decode = jwt.verify(token, secretObj.secret); //토큰 검증
    isAdmin = JSON.parse(JSON.stringify(decode)).admin;
  }catch(err) {
     res.status(401).end()
  }
try {

  if(isAdmin) { //관리자 일때.. 정상 프로세스
  connection.query(`SELECT id, name, password, intro, favorite, deleted_day from Users`, (error:mysql.MysqlError, rows:any) => { //sql 쿼리
    if (error) { //에러 발생
      logs_(error.toString());
      res.status(404).end();
      return;
    }

    let raw_data:string = JSON.stringify(rows); //가공 안된 데이터
    let data:Array<UserJSON> = JSON.parse(`[${raw_data.substring(1, raw_data.length-1)}]`) //json 배열 형태로 가공

    res.status(200).send(data); //데이터 전송
    return;

    });
    }else {
    res.status(403).end();
    return;
    } 
  }catch(e) {
    res.status(404).end();
    return;
  }
      
});

/////////////      User  권한               ////////////////

router.get(`/GetCollection`, (req:express.Request, res:express.Response) => { //컬렉션 레시피들 가져오기

  let token:string;


if(req.cookies === undefined) {
  res.status(401).end()
  return;
} else {

  let decode:string|object;
    try{
      token = req.cookies.user;
      decode = jwt.verify(token, secretObj.secret)
    }catch(err) {
      res.status(401).end()
      return;
    }

      
    try{
      if(!check_id(JSON.parse(JSON.stringify(decode)).id)) {
        res.status(404).end()
        return;
    }

     let id:string = JSON.parse(JSON.stringify(decode)).id;
    
     connection.query(`SELECT rec.seq ,rec.recipeName, rec.rarity, rec.summary,rec.path ,c.Date FROM Recipe AS rec JOIN Collection AS c ON c.rec_num = rec.seq AND c.id = '${id}'`, (error:mysql.MysqlError, rows:any) => {
        if (error) {
        logs_(error.toString())
        res.status(404).end()
        return;
      }
       
      
       let raw_data:string = JSON.stringify(rows)
       let data:CollectionJSONArray = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}]}`);
       
       res.status(200).send(data);
       return;
    });
    }catch(e) {
      logs_(e);
      res.status(404).end()
      return;
    }
  }
})

////////////////컬렉션 추가

router.post(`/AddCollection/:cId`, (req:express.Request, res:express.Response) => {
  if(!check_number(req.params.cId)) {
    res.status(404).end()
    return;
  }
  let Recipe_seq:number = +req.params.cId; //추가할 레시피 seq
  let cookie = req.headers.cookie; 
  
  if(cookie === undefined) {
    res.status(401).end();
    return;
  } else {
    let decode:object|string;
    
    try{
      let token = req.cookies.user;
      decode =  jwt.verify(token, secretObj.secret);
    }catch(e) {
      res.status(401).end();
      return;
    }
      
      
      try{
      let id:string = JSON.parse(JSON.stringify(decode)).id;

      if(!check_id(id)) {
         res.status(404).end();
         return;
       }

       connection.query(`SELECT * FROM Collection WHERE id='${id}' AND rec_num=${Recipe_seq}`, (error:mysql.MysqlError, rows:any) => {
         if(rows.length != 0 || error) {
           res.status(404).end();
           return;
         }
          connection.query(`INSERT INTO Collection (id, rec_num, Date) VALUES ('${id}', ${Recipe_seq}, '${moment().format('YYYY-MM-DD HH:mm:ss')}')`, (error:mysql.MysqlError, rows:any) => {
              if(error) {
                res.status(404).end();
                return;
              } 
              res.status(200).end();
              return;
            })
        })
     }catch(e) {
       logs_(e);
      res.status(404).end();
      return;
    }
  }
  
    
    
})




/////////////// 회원 가입 
router.post(`/Adduser`,(req:express.Request, res:express.Response) => {

    //////////////////////id, password, name 필드 
   let data:registerJSON = {
     id : req.body.id,
     pwd : req.body.password,
     name : req.body.name 
   }

    ///////////정규식 체크(SQL Injection 방지)
    if(!check_id(data.id) || !check_pwd(data.pwd) || !check_name(data.name) ) {
      res.status(404).end()
      return;
    }
    
      //32바이트의 랜덤 문자열 생성(salt) 
      crypto.randomBytes(32, (err:Error|null, buf:Buffer) => {
        //salt를 이용한 pwd 암호화
         crypto.pbkdf2(data.pwd , buf.toString('base64'), 126117, 64, 'sha512', (err:Error|null, key:Buffer) => {

           let en_pwd:string = key.toString('base64'); //암호화한 pwd 
           let salt:string = buf.toString('base64'); //랜덤 문자열 salt

           let into_data:string[] = [data.id, en_pwd, data.name, salt];
           let sql:string = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';

          connection.query(sql, into_data,(err:mysql.MysqlError|null, results:any) => {
            if(err) {
              res.status(404).end();
              logs_(err.toString());
              return;
              }
            else {
              res.status(200).end();
              return;
              }
            });
         });
      });
});   

///////////유저 검색 Deprecation
router.get('/SearchUser/:id', (req:express.Request, res:express.Response) => {

     if(!check_id(req.params.id)) {
      res.status(404).end(); 
      return;      
      }

   connection.query(`SELECT id,name,intro,favorite,deleted_day from Users WHERE id='${req.params.id}'`, (error:mysql.MysqlError, rows:any) => {
     if (error) {
       logs_(error.toString());
       res.status(404).end();
       return;
     }
     try{
      let raw_data:string = JSON.stringify(rows);
      let data:any = JSON.parse(raw_data.substring(1, raw_data.length-2) + "}");
      res.status(200).send(data);
      return;
     } catch(e) {
       logs_(e);
      res.status(404).end();
      return;
    }
   }
   );
 });



router.get('/GetMyInfo', (req:express.Request, res:express.Response) => {
   
  if(req.cookies === undefined) {
    res.status(401).end()
  } else {

    let token:string;
    let decode:string|object;

    try{
      token = req.cookies.user;
      decode =  jwt.verify(token, secretObj.secret);
    }catch(e) {
      res.status(401).end();
      return;
    }

    try{
      let id:string = JSON.parse(JSON.stringify(decode)).id;
      if(!check_id(id)) {
        res.status(404).end()
        return;
       }
     
        connection.query(`SELECT id,name,intro,favorite,deleted_day from Users WHERE id='${id}'`, (error:mysql.MysqlError, rows:any) => {
         if (error) {
           logs_(error.toString());
           res.status(404).end()
         }
          
         
          let raw_data:string = JSON.stringify(rows)
          let data:UserJSON = JSON.parse(raw_data.substring(1, raw_data.length-1))
          if(data.deleted_day != null) {
            res.status(404).end();
            return;
          } 

          res.status(200).send(data)
       });
    }catch(e) {
       res.status(404).end();
       console.log(e);
       logs_(e);
       return;
    }
     
   
  }
 });

//////// 디코 봇 서버 상태 확인을 위함..
router.get('/check', (req:express.Request, res:express.Response) => {
  res.status(200).end();

})

/////////로그인, 토큰 반환 
 router.post('/login', (req:express.Request, res:express.Response) => {

      
    if(!check_id(req.body.id) || !check_pwd(req.body.password)) {
       res.status(404).end();
     }

    let data:loginJSON = {
      id: req.body.id,
      pwd: req.body.password
    }

try{
  connection.query(`SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id='${data.id}'`, (error:mysql.MysqlError, rows:any) => {
    if(error) {
      logs_(error.toString());
      res.status(404).end()
    }
    crypto.pbkdf2(data.pwd , rows[0].salt, 126117, 64, 'sha512', (err:Error|null, key:Buffer) => {

     if(err) {
       res.status(404).end();
       return;
     }


      if(key.toString('base64') == rows[0].password) {
        
        let token:string = jwt.sign(
          {
            id : req.body.id,
            admin : isAdmin(req.body.id),
          },
          secretObj.secret,
          {
            expiresIn: '30m'
          }
        )

       let data:UserJSON = {
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


 router.post('/NewRoom', (req:express.Request, res:express.Response) => {

   let token:string;
   let decode:object | string;

   if(req.cookies === undefined) {
     res.send(401).end()
     return
   }

   try{
     token = req.cookies.user;
     decode = jwt.verify(token, secretObj.secret);
   }catch(e) {
     res.status(401).end();
     return;
   }




   try {
     
   let input:RoomJSON = {
    title : req.body.title,
    id : JSON.parse(JSON.stringify(decode)).id,
    date: moment().format('YYYY-MM-DD HH:mm:ss'),
    Data : JSON.stringify(req.body.data)
  }

     connection.query(`INSERT INTO RoomInfo (title, id, date, Data) VALUES ('${input.title}', '${input.id}', '${input.date}', '${input.Data}')`, (err:mysql.MysqlError, rows:any) => {
        if(err) {
          res.status(404).end();
          logs_(err.toString());
          return;
        }

        res.status(200).end();
        return;
     });
   }catch(e) {
     res.status(404).end();
     return;
   }
 })

 router.get('/myRoom', (req:express.Request, res:express.Response) => {
   try{

   
   connection.query(`SELECT seq, title, date, Data FROM RoomInfo WHERE id='minsoo0715'`, (err:mysql.MysqlError ,rows:any) => {
     if(err) {
       res.status(404).end();
       return;
     }

     if(rows.length == 0) {
       res.status(204).end();
       return;
     }
     
     let data:any = JSON.parse(JSON.stringify(rows));
      
     

     for(let i:number = 0; i<data.length; i++) {
      data[i].Data = JSON.parse(data[i].Data);
     }
     
     res.status(200).send(data)
     return;
    
   })
  } catch(e) {
    logs_(e);
    res.status(404).end();
  }
 })

router.put('/RoomDataChange/:seq', (req:express.Request, res:express.Response) => {
  let token:string;
  let decode:object|string;

  if(req.cookies === undefined) {
    res.send(401).end()
    return
  }

  try{
    token = req.cookies.user;
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