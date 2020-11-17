import {Request, Response, NextFunction} from 'express';
import { logs_, logs_http } from '../Bot/botplay';
const _request = require('request');

export const chk_req = (req:Request, res:Response, next:NextFunction) => {
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }
  
    if (!req.secure) { res.redirect(307, `https://paperflips.com${req.url}`); } else {
      _request.get({
        url: `http://ip-api.com/json/${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`,
      }, (error:any, response:any, body:any) => {
        try {
          const data:any = JSON.parse(body);
          if (data.countryCode !== 'KR') { // 중국 ip 차단
            res.status(404).end();
            return;
          }
  
          logs_http(`Route :${req.url}     IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
          next();
        } catch (e) {
          logs_(e);
          res.status(404).end();
        }
      });
    }
  }