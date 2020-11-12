
import * as express from 'express'

let router = express.Router();

import {auth} from '../Controller/authetication'
import {user} from '../MiddleWare/user'
import {bot_check} from '../MiddleWare/botcheck'

router.get(`/users`,user.connectCheck, auth(true), user.getAll) //모든 유저 정보를 가져옴  admin 권한

router.get('/GetCollection', user.connectCheck,auth(false), user.getCollection); //아이디 체크

router.post(`/AddCollection/:cId`, user.connectCheck, auth(false), user.addCollection) //컬렉션 추가

router.post('/Adduser', user.connectCheck, user.add)

router.get('/GetMyInfo',user.connectCheck, auth(false), user.getMyInfo)

router.get('/check', bot_check)  //디코 봇 서버 체크 

 router.post('/login', user.connectCheck, user.login);  //로그인 토큰 반환

 router.post('/NewRoom', user.connectCheck, auth(false), user.addNewRoom) //방 만들기 

router.get('/myRoom', user.connectCheck, auth(false), user.getMyRoom) //방 가져오기

router.put(`/RoomDataChange/:seq`, auth(false), user.updateRoom) //방 정보 업데이트

 module.exports = router;