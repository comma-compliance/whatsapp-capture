import { uuidv4 } from './helpers.js'

export const JOB_ID = process.env.NOMAD_JOB_ID || process.env.JOB_ID || uuidv4()

export const WEBSOCKET_URL = process.env.WEBSOCKET_URL
export const WEBHOOK_URL = process.env.WEBHOOK_URL

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
export const AWS_S3_REGION = process.env.AWS_S3_REGION
export const AWS_S3_PREFIX = process.env.AWS_S3_PREFIX

export const SYSTEM_IDENTIFIERS = process.env.SYSTEM_IDENTIFIERS?.split(",")
export const CONTACTS_BATCH_SIZE = parseInt(process.env.CONTACTS_BATCH_SIZE, 10) || 50
export const CONTACTS_DELAY = parseInt(process.env.CONTACTS_DELAY, 10) || 3000

export const APP_PUBLIC_KEY = process.env.APP_PUBLIC_KEY
export const WHATSAPP_PRIVATE_KEY = process.env.WHATSAPP_PRIVATE_KEY
export const WHATSAPP_PUBLIC_KEY = process.env.WHATSAPP_PUBLIC_KEY
