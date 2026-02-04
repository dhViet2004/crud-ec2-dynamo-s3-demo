const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, BUCKET_NAME } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload file lên S3
 */
async function uploadToS3(file) {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const fileKey = `products/${Date.now()}-${uuidv4()}-${file.originalname}`;
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype
    });

    await s3Client.send(command);

    // Tạo URL công khai
    const url = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

    return { url, key: fileKey };
  } catch (err) {
    console.error('uploadToS3 error:', err);
    throw err;
  }
}

/**
 * Xóa file khỏi S3
 */
async function deleteFromS3(fileKey) {
  try {
    if (!fileKey) {
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey
    });

    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error('deleteFromS3 error:', err);
    throw err;
  }
}

module.exports = {
  uploadToS3,
  deleteFromS3
};
