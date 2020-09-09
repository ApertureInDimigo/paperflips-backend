let express = require('express');
let router = express.Router();




const mysql:any = require('mysql');       //mysql 모듈
const dbconfig:any = require('../config/database.ts'); //database 구조
let connection:any = mysql.createConnection(dbconfig); //mysql 연결
let logs_ = require('../Bot/botplay');

import {check, check_name} from '../util/checker'
import { isUndefined } from 'util';

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



router.get('/Search', (req:any, res:any) => {
  let recipe:string = req.query.q;

  if(!check_name(recipe)) {
    res.status(404).end()
  }
  try {
  connection.query(`SELECT seq, recipeName, rarity, summary from Recipe WHERE recipeName LIKE '%${recipe}%'`, (error:any, rows:any) => {
    if(error) {
      logs_(error);
      res.status(404).end()
    }
      if(rows.length == 0) {
        res.status(404).end()
      } 
      let raw_data:string = JSON.stringify(rows);
      let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}] , "length" : ${rows.length}}`);
      res.status(200).send(data)
  })
 }catch (e) {
   logs_(e);
   res.status(404).end();
 }
}
)


router.get('/AllData', (req:any, res:any) => {

  try{
    connection.query('SELECT seq, recipeName,rarity,summary from Recipe', (error:any, rows:any) => {
      if (error) {
        logs_(error)

        res.status(404).end()
       }
       let raw_data:string = JSON.stringify(rows);      
       let data:any = JSON.parse(`{ "data" : [ ${raw_data.substring(1, raw_data.length - 1)}] , length" : ${rows.length}}`);
        res.status(200).send(data)
    });
  } catch(e) {
    logs_(e);
    res.status(404).end()
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

 module.exports = router;