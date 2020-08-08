var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var router = require('./router/main')(app);
app.set('views', __dirname + '/public');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
var server = app.listen(process.env.PORT || 3000, function () {
    console.log("Express server has started on port 3000");
    console.log(process.env.PORT);
});
app.use(express.static('public'));
