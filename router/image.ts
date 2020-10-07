import * as express from 'express'; //express 모듈
let router:express.Router = express.Router(); //라우터 객체 

import * as fs from 'fs'; //파일 관련 모둘
import * as path from 'path'; //경로 모듈
import multer, { Multer, MulterError, StorageEngine } from 'multer';
import * as AWS from 'aws-sdk'; //aws sdk
AWS.config.region = 'us-east-1' // aws 지역
let s3:AWS.S3 = new AWS.S3(); //S3 객체 





let storage:multer.StorageEngine = multer.diskStorage({  
    destination: function(req:express.Request, file:Express.Multer.File, callback:(error: Error | null, destination: string) => void) {
      callback(null, "images/")
    }, //파일 저장 위치
    filename (req:express.Request, file:Express.Multer.File, callback:(error: Error | null, destination: string) => void) {
      callback(null, file.originalname)
  } //파일 이름 
  })
  
  
  
  let upload:multer.Multer = multer( //업로드 객체
    {
      storage:storage
    }
  )

  function upload_to_server(locate:string, fname:string) { //파일 업로드를 위함 
    let param = {
      'Bucket':'paperflips', //버킷 이름       
      'Key': locate + '/' + fname, //저장할 파일 이름 
      'ACL':'public-read', //권한, 공개 읽기
      'Body': fs.createReadStream('./images/' + fname), //읽어올 곳 
      'ContentType':'image/png'  //파일 형식 
    } 
    
    s3.putObject(param, function(err:any, data:any) {
        console.log(err);
        console.log(data);
    }) //에러 처리 구현 예정 
  }
  
router.post('/upload/profile/:imgname', upload.single('img'), (req:express.Request,res:express.Response) => {  //프로필 사진 이미지. 아직 사용X
           
  try{
    let result:any = {
      originalname : req.file.originalname,
      size : req.file.size,
    }
    
    let fname:string = req.params.imgname + path.extname(result.originalname);
    

    console.log(path.extname(req.file.originalname))
    fs.rename('images/' + req.file.originalname, 'images/'+ req.params.imgname + path.extname(req.file.originalname), function(err : NodeJS.ErrnoException | null) {
      if (err) console.log(err);
      else console.log('success changename')
    })  
    
   upload_to_server('profile', fname);


    res.status(200).end();
  }catch(e) {
    res.status(404).end();

  }
    
  })
  
  
   module.exports = router;
  