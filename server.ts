const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const https = require('https');
const fs = require('fs');
const favicon = require('serve-favicon');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const vultrIP = require('./config/vurturIP')

import {chk_req} from './Controller/chk_req'


const app = express();
app.use(compression());
app.use(helmet());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(favicon(path.join(__dirname, 'favicon', 'favicon.ico')));

app.use(chk_req);

console.log(process.env.NODE_ENV);
require('./router/main')(app);

// app.set('views', `${__dirname}/public`);
// app.set('view engine', 'ejs');
// app.engine('html', require('ejs').renderFile);

if (process.env.NODE_ENV === 'production') {
  app.listen(80, vultrIP, () => {
    console.log('Express server has started on port 80');
  });
  const options = {
    ca: fs.readFileSync('ssl-key/paperflips_com.ca-bundle'),
    cert: fs.readFileSync('ssl-key/paperflips_com.crt'),
    key: fs.readFileSync('ssl-key/paperflips_com.key'),
  };

  https.createServer(options, app).listen(443, vultrIP, () => {
    console.log('Express server has started on port 443');
  });
  
} else if (process.env.NODE_ENV === 'development') {
  app.listen(8000, () => {
    console.log('Express server has started on port 8000');
  });
}

