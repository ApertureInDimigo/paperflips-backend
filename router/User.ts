let express = require('express');
let router = express.Router();


const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
const connection:any = mysql.createConnection(dbconfig); //mysql 연결

import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util';


router.get('/users', (req:any, res:any) => {
    log('GET USERS', 'default');

     connection.query('SELECT * from Users', (error:any, rows:any) => {
       if (error) console.log(error);
       console.log('User info is: ', rows);
       res.send(rows);
     });
   });


   router.post('/Adduser',(req:any, res:any) => {
        
    if(req.body.id == '' || req.body.password == '' || req.body.name == '') {
      console.log('Undefined detected');
      res.send(JSON.stringify({"status": 404, "error": 1}))
    }  

else {

    log('POST USERS id : ' + req.body.id +' pwd : ' + req.body.password + ' name : '+ req.body.name, 'default');

    let data = [req.body.id, req.body.password, req.body.name];
    let sql:string = 'INSERT INTO Users (id, password, name) VALUES(?, ?, ?)';
 let query = connection.query(sql, data,(err:any, results:any) => {
   if(err) console.log(err);
   res.send(JSON.stringify({"status": 200, "error": null, "response": results}));  
 });
}
});   

router.get('/SearchUser/:id', (req:any, res:any) => {
 
    const check:boolean = /^[A-Z0-9a-z]$/.test(req.params.id);
  
   if(check) {
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
    
    connection.query('SELECT password from Users WHERE id="' + req.body.id + '"', (error:any, rows:any) => {

      let a: number = 1;      //정상 처리 확인 코드
      let e: String = "";    //error 코드 

      if (error) {       //sql error 발생
        console.log(error);
        a = 0;
        e = "sql error";
      } else if(isUndefined(req.body.password)) {                //password값이 전송 되지 않았을때...
        a = 0;
        e = "password undefined";
      } else if(rows[0].password != req.body.password) {
        a = 0;
        e = "unmatch error"
      } else {
        a = 1;
      }

      console.log(e);

      log((!e ? "success" : "failed ") + " " + req.body.id + " " , !e ? 'default' : 'error');




      //if(e) {
      //  log(a == 1 ? "success" : "failed" + " " + req.body.id + " " + e, a == 1 ? 'default' : 'error');
      //} else {
      //  log(a == 1 ? "success" : "failed" + " " + req.body.id + " " + e, a == 1 ? 'default' : 'error');
      //}
       

        res.send(JSON.stringify({"success": a.toString()}))
    });
  }); 


 module.exports = router;