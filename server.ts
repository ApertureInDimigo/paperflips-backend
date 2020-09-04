var express = require('express');
var bodyParser = require('body-parser');
var request_other = require('request');


var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req:any,res:any,next:any) {
    console.log('execute')
    request_other.get({
        url: 'http://ip-api.com/json'
      }, function(error:any, response:any, body:any) {
        let data:any = JSON.parse(body);
        console.log(`접속국가 ${data.countryCode}`)
        if(data.countryCode == "CN") {
            res.json(JSON.parse(`{"status" : "403"}`));
        }else {
            next();
        }
      }
      
      )
})


var router = require('./router/main')(app);

app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

var server = app.listen(process.env.PORT || 3000 , function(){
    console.log("Express server has started on port 3000");
    console.log(process.env.PORT == undefined ? process.env.PORT : " ");
})

app.use(express.static('public'));
