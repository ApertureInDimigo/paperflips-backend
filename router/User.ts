let express = require('express');
let router = express.Router();

const crypto = require('crypto');


const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
let connection:any = mysql.createConnection(dbconfig); //mysql 연결

import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util';
import { check, check_id, check_name, check_pwd } from '../checker'

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

router.get('/users', (req:any, res:any) => {
  checkconnect();

    log('GET USERS', 'default');

     connection.query('SELECT id, name, password, intro, favorite, deleted_day from Users', (error:any, rows:any) => {
       if (error) console.log(error);
       res.send(rows);
     });
   });


   router.post('/Adduser',(req:any, res:any) => {
    let id:string = req.body.id;
    let pwd:string = req.body.password;
    let name:string = req.body.name;
    
    if(check_id(id) && check_pwd(pwd) && check_name(name) ) {
    
    
      crypto.randomBytes(32, (err:any, buf:Buffer) => {
        
         crypto.pbkdf2(pwd , buf.toString('base64'), 126117, 64, 'sha512', (err:any, key:any) => {
           let pwd:string = key.toString('base64');
           let salt:string = buf.toString('base64');

           log('POST USERS id : ' + id +' pwd : ' + pwd + ' name : '+ name, 'default');

    let data = [id, pwd, name, salt];
    let sql:string = 'INSERT INTO Users (id, password, name, salt) VALUES(?, ?, ?, ?)';

  checkconnect();
 connection.query(sql, data,(err:any, results:any) => {
   if(err) res.send(JSON.parse('{\"status\":404}'))


   res.send(JSON.parse('{\"status\":200}'))
 });


         });
       });
  
   
   
   
  
  

    

    }
    else {
      res.send(JSON.parse('{\"status\":404}'))
    }
   
});   

router.get('/SearchUser/:id', (req:any, res:any) => {
  checkconnect();

     if(check_id(req.params.id)) {
   connection.query('SELECT * from Users WHERE id="' + req.params.id + '"', (error:any, rows:any) => {
     if (error) console.log(error);

     
    
     try{
      let obj:string = JSON.stringify(rows);
      let obj2:any = JSON.parse(obj.substring(1, obj.length-2) + "," + "\"status\": 200}");
      res.send(obj2);
     } catch(e) {
      res.send(JSON.stringify({"status" : 404}));
    }
    

     
   }
   
   
   );
  }
  else res.send(JSON.stringify({"status" : 404}))
 });


 router.post('/login', (req:any, res:any) => {
  checkconnect();
     

    if(check_id(req.body.id) && check_pwd(req.body.password)) {
      connection.query(`SELECT password, salt, name, intro, favorite, deleted_day from Users WHERE id="`  + req.body.id + `"`, (error:any, rows:any) => {
      
  
        if(error)  res.send(JSON.parse( `{ "status" : 404}`));
  

        crypto.pbkdf2(req.body.password , rows[0].salt, 126117, 64, 'sha512', (err:any, key:any) => {

          if(key.toString('base64') == rows[0].password) {

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
            res.send(JSON.parse( `{ "status" : 404}`))
          }

          
          
        });
      });
    } else {
      res.send(JSON.parse( `{ "status" : 403}`));
    }
    
    
  }); 

 module.exports = router;