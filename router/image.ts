export {};

let express = require('express');
let router = express.Router();

let fs:any = require('fs') //파일 관리 모듈
const path = require('path') //경로 모듈
const multer = require('multer'); //사진 모듈



let storage:any = multer.diskStorage({
    destination: function(req:any, file:any, callback:any) {
      callback(null, "images/")
    },
    filename (req:any, file:any, callback:any) {
      callback(null, file.originalname)
  }
  })
  
  
  
  let upload:any = multer(
    {
      storage:storage
    }
  )


  let AWS = require('aws-sdk')
  
  AWS.config.region = 'us-east-1'
  
  let s3 = new AWS.S3();
  

  function upload_to_server(locate:string, fname:string) {
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
    })
  }
  

router.post('/upload/profile/:imgname', upload.single('img'), (req:any,res:any) => {
           
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


  router.get('/image/:id', (req:any, res:any) => {
  
     res.json(
        {

        }
     )
   });
  
  
   module.exports = router;
  