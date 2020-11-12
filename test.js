let AWS = require('aws-sdk');

// create a new s3 object
var s3 = new AWS.S3();

var BUCKET_NAME = 'paperflips';
var OLD_KEY = 'recipe_img/9.png';
var NEW_KEY = 'recipe_img/8.png';

// // Copy the object to a new location
// console.log('paperflips');
// s3.copyObject({
//   Bucket: BUCKET_NAME, 
//   CopySource: `${BUCKET_NAME}/${OLD_KEY}`, 
//   Key: NEW_KEY
//  })
//   .promise()
//   .then(() => 
//     // Delete the old object
//     s3.deleteObject({
//       Bucket: BUCKET_NAME, 
//       Key: OLD_KEY
//     }).promise()
//    )
//   // Error handling is left up to reader
//   .catch((e) => console.error(e))

  s3.deleteObject({
      Bucket:'paperflips',
      Key: 'recipe_img/8.png'

  }).promise().catch((e) => console.log(error))