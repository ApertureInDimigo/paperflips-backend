const UserRouter = require('./User')
const recipeRouter = require('./recipe');
import {privacy, robot} from '../MiddleWare/etc'
const cache = require('apicache').middleware

module.exports = function(app:any)

{     
      app.use('/User',UserRouter) //유저 관련 라우터

      app.use('/rec', recipeRouter) //레시피 관련 라우터
      
      app.get('/privacy', cache('60 minutes'), privacy); //개인정보 취급 방침

      app.get("/robots.txt", cache('60 minutes'), robot) //검색 엔진 접근 권한 
}

