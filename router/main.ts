
let UserRouter:any = require('./User')
let ImageRouter:any = require('./image')
let recipeRouter:any = require('./recipe')

module.exports = function(app:any)

{
      app.use('/User',UserRouter)
      app.use('/img', ImageRouter)
      app.use('/rec', recipeRouter)

      //restful API 구현부
      
      app.get('/recipe_step', (req:any, res:any) => {
        
        res.render('index.html')
      });
}
