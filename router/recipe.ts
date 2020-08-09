let express = require('express');
let router = express.Router();


const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
let connection:any = mysql.createConnection(dbconfig); //mysql 연결


import { log } from '../log/log';  //로그 임포트
import { isUndefined, callbackify } from 'util';

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


router.get('/data/:seq', (req:any, res:any) => {
    if(isUndefined(req.params.seq)) console.log('undefined');
    checkconnect();
    console.log('recipe get')
    
    

    connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\''+req.params.seq + '\'', (error:any, rows:any) => {
     if (error) {
       console.log(error);
      // res.send(JSON.parse('{\"status\" : 404}'));
     }
     console.log('recipe info is: ', rows);

     try{
       let obj:string = JSON.stringify(rows);
      // let obj2:any = JSON.parse( "{" + obj + "," + "\"status\": 200}");
       let obj2:any = JSON.parse("{" + "\"data\":" + obj.substring(1, obj.length - 1) + "," +"\"status\": 200" + "}");
     

       res.send(obj2);
    //  res.send(obj2);
      } catch(e) {
        console.log(e);
       res.send(JSON.parse('{\"status\" : 404}'));
     }
     
   });

 });

 module.exports = router;