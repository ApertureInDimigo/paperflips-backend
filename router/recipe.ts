import * as express from 'express';
import {recipe} from '../MiddleWare/recipe'
import {upload} from '../Image_Server/storage_handler'
import {auth} from '../Controller/authetication'
let router:express.Router = express.Router();

//////////////////////////////레시피 데이터 
router.get(`/data/:seq`, recipe.connectCheck,recipe.get);
//////////// 운영자 권한 
router.post(`/Upload`,recipe.connectCheck,auth(true),upload.single(`img`), recipe.upload) //파라미터로

router.get(`/Search`, recipe.connectCheck,recipe.search);

router.get(`/AllData`, recipe.connectCheck, recipe.getAll)   //모든 레시피 데이터 가져오기 LIMIT 추가 예정.
  
router.post(`/AddDetail/:recipeName`, recipe.connectCheck, auth(true), recipe.addDetail)

router.get(`/GetDetail/:recipeName`, recipe.connectCheck, recipe.getDetail)

 module.exports = router;