let express = require('express');
let router = express.Router();


const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
let connection:any = mysql.createConnection(dbconfig); //mysql 연결

import {check} from '../checker'

import {stat} from '../HTTP_req'
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


router.get('/AllData', (req:any, res:any) => {
  connection.query('SELECT recipeName,rarity,summary from Recipe', (error:any, rows:any) => {
    if (error) {
      console.log(error);
      res.send(stat.get(404))
     }
    console.log('recipe info is: ', rows);

    try{
      let obj:string = JSON.stringify(rows);
     // let obj2:any = JSON.parse( "{" + obj + "," + "\"status\": 200}");
    
      let obj2:any = JSON.parse(`{ "data" : [ ${obj.substring(1, obj.length - 1)}] , "status" : 200, "length" : ${rows.length}}`);

      res.send(obj2);
   //  res.send(obj2);
     } catch(e) {
       console.log(e);
      res.send(stat.get(404));
    }
    
  });
})


//////////////////////////////카드 데이터
router.get('/data/:seq', (req:any, res:any) => {

    if(check(req.params.seq)) {

    if(isUndefined(req.params.seq)) console.log('undefined');
    checkconnect();
    console.log('recipe get')
    let seq:number = req.params.seq;
    if(check(seq.toString())) {
    checkconnect();
    connection.query('SELECT recipeName,rarity,summary from Recipe WHERE seq=\''+req.params.seq + '\'', (error:any, rows:any) => {
     if (error) {
       console.log(error);
       res.send(stat.get(404))
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
       res.send(stat.get(404));
     }
     
   });
  }else {
    res.send(stat.get(404));
  }
} else {
  console.log('error')
  res.send(stat.get(404));
}
 });

 module.exports = router;