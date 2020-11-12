import express from 'express'
import jwt from 'jsonwebtoken';
import {secretObj} from '../config/jwt' //jwt 비밀키


export function auth(isAdminFunc:boolean) {
    return (req:express.Request,res:express.Response,next:express.NextFunction) => {
      let token:string;
      let decode:object|string;
    
      if(req.cookies === undefined) {
        res.send(401).end()
        return;
      }
      try{
        token = req.cookies.user;
        decode = jwt.verify(token, secretObj.secret); //토큰 검증
        res.locals.id = JSON.parse(JSON.stringify(decode)).id;

        if(isAdminFunc) {
          if(!JSON.parse(JSON.stringify(decode)).admin) {
            res.status(403).end();
            return;
          }
        }

        next();
      }catch(err) {
         res.status(401).end()
         return;
      }
  
  }
}




const admin_auth = (req:express.Request, res:express.Response, next:express.NextFunction) => {

}