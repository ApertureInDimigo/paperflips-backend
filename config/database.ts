
 import * as mysql from 'mysql';
 
 export let dbconfig:mysql.ConnectionConfig;

if(process.env.NODE_ENV == "development") {
  dbconfig =  {
      host     : 'localhost',
      user     : 'root',
      password : 'Aperturecs1',
      database : 'paperflips',
      multipleStatements: true
    };
  
}else if(process.env.NODE_ENV == "production" )
  {
    dbconfig = {
      host     : 'localhost',
      user     : 'root',
      password : 'Aperturecs1',
      database : 'paperflips',
      multipleStatements: true
    };
}
