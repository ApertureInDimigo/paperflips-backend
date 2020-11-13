let express = require('express');
let bodyParser = require('body-parser');
let _request = require('request');
let cookieParser = require('cookie-parser');
let http = require('http');
let https = require('https');
let fs = require('fs');
let favicon = require('serve-favicon')
let path = require('path')
let helmet = require('helmet');
let compression = require('compression');

import {Request, Response, NextFunction, Router} from 'express'
import {logs_, logs_http} from './Bot/botplay'



let app = express();
app.use(compression());
app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));

app.use(function(req:Request,res:Response,next:NextFunction) { 
  if(!req.secure && process.env.NODE_ENV == "production"){ res.redirect(307, "https://paperflips.com"+req.url); return; }else{ 
    _request.get({
      url: `http://ip-api.com/json/${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`
    }, function(error:any, response:any, body:any) {
        try{
                let data:any = JSON.parse(body);
                if(data.countryCode != "KR") { //중국 ip 차단
                    res.status(404).end()
                    return;
                }else {

                    logs_http(`Route :${req.url}     IP: ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`)
                    next();
                }
        }catch(e) {
                logs_(e);
                res.status(404).end()
                return;
        }
      
    }
    )

   }  
})

console.log(process.env.NODE_ENV);
let router:Router = require('./router/main')(app);


app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


if(process.env.NODE_ENV == "production") {

  let server = app.listen(80 ,'141.164.50.191' ,function(){
    console.log("Express server has started on port 80");
})
const options = {
  ca: fs.readFileSync('ssl-key/paperflips_com.ca-bundle'),
  cert: fs.readFileSync('ssl-key/paperflips_com.crt'),
  key: fs.readFileSync('ssl-key/paperflips_com.key')
};
https.createServer(options, app).listen(443,'141.164.50.191', function() {
        console.log("Express server has started on port 443");
});

}else if(process.env.NODE_ENV == "development") {
    let server = app.listen(8000, function() {
      console.log("Express server has started on port 8000")
      })
}





app.use(express.static('public'));


