import multer from 'multer';

import * as express from 'express';

const storage:multer.StorageEngine = multer.diskStorage({  
    destination: function(req:express.Request, file:Express.Multer.File, callback:(error: Error | null, destination: string) => void) {
      callback(null, "images/")
    }, //파일 저장 위치
    filename (req:express.Request, file:Express.Multer.File, callback:(error: Error | null, destination: string) => void) {
      callback(null, file.originalname)
  } //파일 이름 
  })
  
  
  export const upload:multer.Multer = multer( //업로드 객체 
    {
      storage:storage
    }
  )