var UserRouter = require('./User');
var ImageRouter = require('./image');
var recipeRouter = require('./recipe');
module.exports = function (app) {
    app.use('/User', UserRouter);
    app.use('/img', ImageRouter);
    app.use('/rec', recipeRouter);
    //restful API 구현부
    app.get('/recipe_step', function (req, res) {
        res.render('index.html');
    });
};
