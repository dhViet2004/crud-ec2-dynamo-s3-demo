const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const requiredEnv = ['AWS_REGION', 'AWS_DYNAMO_TABLE', 'AWS_S3_BUCKET'];
const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

const REGION = process.env.AWS_REGION;
const TABLE_NAME = process.env.AWS_DYNAMO_TABLE;
const BUCKET_NAME = process.env.AWS_S3_BUCKET;

const s3Client = new S3Client({ region: REGION });
const ddbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true }
});

module.exports = {
  REGION,
  TABLE_NAME,
  BUCKET_NAME,
  s3Client,
  docClient
};
