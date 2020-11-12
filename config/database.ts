
 import * as mysql from 'mysql';
 
 export let dbconfig:mysql.ConnectionConfig = {
    host     : 'localhost',
    user     : 'root',
    password : 'Aperturecs1',
    database : 'paperflips',
    multipleStatements: true
  };
