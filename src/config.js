import { uuidv4 } from './helpers.js'

export const JOB_ID = process.env.NOMAD_JOB_ID || process.env.JOB_ID || uuidv4()

export const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://tcc-rails-app-1:3000/cable?token=this_should_never_be_in_prod'

export const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://100.95.55.44:3000/webhooks/incoming/whatsapp_webhooks/'

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
export const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME
export const AWS_S3_REGION = process.env.AWS_S3_REGION
export const AWS_S3_PREFIX = process.env.AWS_S3_PREFIX || 'whatsapp-sessions/'

export const SYSTEM_IDENTIFIERS = process.env.SYSTEM_IDENTIFIERS?.split(",") || ['14233840306']
export const CONTACTS_BATCH_SIZE = parseInt(process.env.CONTACTS_BATCH_SIZE, 10) || 50
export const CONTACTS_DELAY = parseInt(process.env.CONTACTS_DELAY, 10) || 3000

export const APP_PUBLIC_KEY = process.env.APP_PUBLIC_KEY || '9sjyElWmHnZkYrHz6/dlKViDBR7kvuT9db0sgSBPs2Q='
export const WHATSAPP_PRIVATE_KEY = process.env.WHATSAPP_PRIVATE_KEY || '+LafQxGJTDAxPdWtL/0gcbVjSVWkNOClkKjuBbwntU0='
export const WHATSAPP_PUBLIC_KEY = process.env.WHATSAPP_PUBLIC_KEY || 'TlnAfMB8rSa0JH6dBal9arpYkLQ+KSG93+v/vAxMny8='
