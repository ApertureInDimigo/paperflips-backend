export {}; //TS의 블록 스코프 에러를 대처하기 위함 

let express = require('express'); //express 프레임워크
let router = express.Router(); //라우터 객체 

let fs:any = require('fs') //파일 관리 모듈
const path = require('path') //경로 모듈
const multer = require('multer'); //파일 업로드 모듈



let storage:any = multer.diskStorage({  
    destination: function(req:any, file:any, callback:any) {
      callback(null, "images/")
    }, //파일 저장 위치
    filename (req:any, file:any, callback:any) {
      callback(null, file.originalname)
  } //파일 이름 
  })
  
  
  
  let upload:any = multer( //업로드 객체
    {
      storage:storage
    }
  )


  let AWS = require('aws-sdk') //aws sdk
  
  AWS.config.region = 'us-east-1' // aws 지역 
  
  let s3 = new AWS.S3(); //S3 객체 
  

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
  

router.post('/upload/profile/:imgname', upload.single('img'), (req:any,res:any) => {  //프로필 사진 이미지. 아직 사용X
           
  try{
    let result = {
      originalname : req.file.originalname,
      size : req.file.size,
    }
    
    let fname:string = req.params.imgname + path.extname(result.originalname);
    

    console.log(path.extname(req.file.originalname))
    fs.rename('images/' + req.file.originalname, 'images/'+ req.params.imgname + path.extname(req.file.originalname), function(err : any) {
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
  