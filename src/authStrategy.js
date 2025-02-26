// authStrategy.js

import pkg from 'whatsapp-web.js'

import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import AwsS3Store from 'wwebjs-aws-s3/src/AwsS3Store.js'
import {
  JOB_ID,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME,
  AWS_S3_REGION,
  AWS_S3_PREFIX
} from './config.js'
const { LocalAuth, RemoteAuth } = pkg

export function getAuthStrategy () {
  if (
    AWS_ACCESS_KEY_ID &&
    AWS_SECRET_ACCESS_KEY &&
    AWS_S3_BUCKET_NAME &&
    AWS_S3_REGION
  ) {
    // Use the RemoteAuth strategy with S3 if AWS keys are present
    const s3 = new S3Client({
      region: AWS_S3_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    })

    const store = new AwsS3Store({
      bucketName: AWS_S3_BUCKET_NAME,
      remoteDataPath: AWS_S3_PREFIX,
      s3Client: s3,
      putObjectCommand: PutObjectCommand,
      headObjectCommand: HeadObjectCommand,
      getObjectCommand: GetObjectCommand,
      deleteObjectCommand: DeleteObjectCommand
    })

    console.log('Using RemoteAuth with S3 storage')

    return new RemoteAuth({
      clientId: JOB_ID,
      dataPath: './data',
      store,
      backupSyncIntervalMs: 600000 // 600 seconds
    })
  } else {
    console.log('Using LocalAuth with local storage')
    return new LocalAuth({
      dataPath: '/data'
    })
  }
}

export const browserArgs = [
  '--disable-accelerated-2d-canvas', '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows', '--disable-breakpad',
  '--disable-cache', '--disable-component-extensions-with-background-pages',
  '--disable-crash-reporter', '--disable-dev-shm-usage',
  '--disable-extensions', '--disable-gpu',
  '--disable-hang-monitor', '--disable-ipc-flooding-protection',
  '--disable-mojo-local-storage', '--disable-notifications',
  '--disable-popup-blocking', '--disable-print-preview',
  '--disable-prompt-on-repost', '--disable-renderer-backgrounding',
  '--disable-software-rasterizer', '--ignore-certificate-errors',
  '--log-level=3', '--no-default-browser-check',
  '--no-first-run', '--no-sandbox',
  '--no-zygote', '--renderer-process-limit=100',
  '--enable-gpu-rasterization', '--enable-zero-copy',
  '--disable-setuid-sandbox'
] // Found from channel here https://discord.com/channels/698610475432411196/1331949870457688136/1331969167607336960
