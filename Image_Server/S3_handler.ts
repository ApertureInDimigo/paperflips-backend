import * as AWS from 'aws-sdk'
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs'
import * as path from 'path';

export class S3_server {
    private s3:AWS.S3

    constructor() {
       AWS.config.region = 'us-east-1'
       this.s3 = new AWS.S3();
    }

    profile_upload(id:string, original:string):void {
        this.upload_to_server('profile', id, id+path.extname(original));
    }

    recipe_upload(seq:string, original:string):void {
        
        this.upload_to_server('recipe_img', original, `${seq}${path.extname(original)}`);
        
    }

    private upload_to_server(locate:string, fname:string, setname:string):void {
        let param:PutObjectRequest = {
            'Bucket':'paperflips', //버킷 이름
            'Key': locate + '/' + setname, //저장할 파일 이름 
                'ACL':'public-read', //권한, 공개 읽기
            'Body': fs.createReadStream('./images/' + fname), //읽어올 곳 
            'ContentType':'image/png'  //파일 형식 
          } 
          
          this.s3.putObject(param, function(err: AWS.AWSError, data:AWS.S3.Types.PutObjectOutput) { //에러 핸들링 추가 예정 
              console.log(err);
              console.log(data);
          })
    }


}