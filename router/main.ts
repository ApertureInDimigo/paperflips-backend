let UserRouter = require('./User')
let ImageRouter = require('./image')
let recipeRouter = require('./recipe');
import {privacy, robot} from '../MiddleWare/etc'

module.exports = function(app:any)

{     
      app.use('/User',UserRouter) //유저 관련 라우터
      app.use('/img', ImageRouter) //이미지 관련 라우터
      app.use('/rec', recipeRouter) //레시피 관련 라우터

      //restful API 구현부
      
      app.get('/privacy', privacy);

      app.get("/robots.txt", robot)
}
