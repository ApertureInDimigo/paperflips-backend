let express = require('express');
let bodyParser = require('body-parser');
let request_other = require('request');


let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req:any,res:any,next:any) {
    console.log('execute')
    request_other.get({
        url: 'http://ip-api.com/json'
      }, function(error:any, response:any, body:any) {
        let data:any = JSON.parse(body);
        if(data.countryCode == "CN") { //중국 ip 차단
            res.status(404).end()
            return;
        }else {
            next();
        }
      }
      
      )
})


let router = require('./router/main')(app);

app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

let server = app.listen(process.env.PORT || 3000 , function(){
    console.log("Express server has started on port 3000");
})

app.use(express.static('public'));
