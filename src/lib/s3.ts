import { S3Client } from '@aws-sdk/client-s3';

// Garante que o endpoint tenha o protocolo https://
const endpoint = process.env.SPACES_ENDPOINT?.startsWith('http') 
  ? process.env.SPACES_ENDPOINT 
  : `https://${process.env.SPACES_ENDPOINT}`;

// Extrai a região do endpoint (ex: nyc3.digitaloceanspaces.com -> nyc3)
const region = process.env.SPACES_ENDPOINT?.split('.')[0] || 'us-east-1';

const s3Client = new S3Client({
  forcePathStyle: false, // Config para Digital Ocean Spaces (Virtual Hosted Style)
  endpoint: endpoint,
  region: region, 
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY!,
    secretAccessKey: process.env.SPACES_SECRET_KEY!,
  },
});

export { s3Client };