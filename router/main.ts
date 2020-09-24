

let UserRouter:any = require('./User')
let ImageRouter:any = require('./image')
let recipeRouter:any = require('./recipe')

module.exports = function(app:any)

{     
      app.use('/User',UserRouter) //유저 관련 라우터
      app.use('/img', ImageRouter) //이미지 관련 라우터
      app.use('/rec', recipeRouter) //레시피 관련 라우터

      //restful API 구현부
      
      app.get('/privacy', (req:any, res:any) => {
        
        res.render('privacy.html')
      });
}
