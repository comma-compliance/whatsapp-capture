import './sentry.js'
import pkg from 'whatsapp-web.js'
import AwsS3Store from 'wwebjs-aws-s3/src/AwsS3Store.js'

import qrcode from 'qrcode-terminal'
import { createCable } from '@anycable/core'
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws'
import fetch from 'node-fetch'
const { Client, LocalAuth, RemoteAuth } = pkg
const {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3')

function uuidv4 () {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
  )
}

const JOB_ID = process.env.NOMAD_JOB_ID || uuidv4()
console.log('JOB_ID:', JOB_ID)

// Get the WebSocket URL from the environment variable
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://tcc-rails-app-1:3000/cable?token=this_should_never_be_in_prod'

// Define the Webhook URL
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://100.95.55.44:3000/webhooks/incoming/whatsapp_webhooks/'

// Create AnyCable consumer
const consumer = createCable(WEBSOCKET_URL, {
  websocketImplementation: WebSocket
})

// Subscribe to the channel
console.log('Subscribing to the chat channel', WEBSOCKET_URL)
const channel = new ChatChannel()
consumer.subscribe(channel)

channel.on('connect', msg => console.log(`connected ${msg.name}: ${msg.text}`))
channel.on('message', msg => console.log(`${msg.name}: ${msg.text}`))

// Handle custom typing messages
channel.on('typing', msg => console.log(`User ${msg.name} is typing`))

// Or subscription close events
channel.on('close', () => console.log('Disconnected from chat'))

// Or temporary disconnect
channel.on('disconnect', () => console.log('No chat connection'))

// Connect the consumer
consumer.connect()

// Determine which auth strategy to use
let authStrategy
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME && process.env.AWS_S3_REGION) {
  // Use the RemoteAuth strategy with S3 if AWS keys are present
  const s3 = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  })
  const putObjectCommand = PutObjectCommand
  const headObjectCommand = HeadObjectCommand
  const getObjectCommand = GetObjectCommand
  const deleteObjectCommand = DeleteObjectCommand
  const store = new AwsS3Store({
    bucketName: process.env.AWS_S3_BUCKET_NAME,
    remoteDataPath: process.env.AWS_S3_PREFIX || 'whatsapp-sessions/',
    s3Client: s3,
    putObjectCommand,
    headObjectCommand,
    getObjectCommand,
    deleteObjectCommand
  })
  authStrategy = new RemoteAuth({
    clientId: JOB_ID,
    dataPath: './data',
    store,
    backupSyncIntervalMs: 600000 // 600 seconds
  })
  console.log('Using RemoteAuth with S3 storage')
} else {
  // Default to LocalAuth if no AWS keys are found
  authStrategy = new LocalAuth({
    dataPath: '/data'
  })
  console.log('Using LocalAuth with local storage')
}

// WhatsApp Client
const client = new Client({
  authStrategy,
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

// Generate and display QR code for authentication
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
  console.log('QR RECEIVED', qr)

  // Send the QR code to the AnyCable server
  channel.speak({ qr_code: qr })
  console.log('QR code sent to AnyCable server')
})

// When authenticated
client.on('authenticated', () => {
  console.log('AUTHENTICATED')
  channel.speak({ message: 'AUTHENTICATED' })
})

client.on('remote_session_saved', () => {
  console.log('remote session saved')
  channel.speak({ message: 'remote session saved' })
})

// Handle new messages
client.on('message', async (message) => {
  console.log('MESSAGE RECEIVED:', message.body)

  // Send the message to the webhook URL
  const data = {
    key: message.from,
    message
  }

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then((res) => res.text())
    .then((text) => console.log('Message sent to webhook:', text))
    .catch((err) => console.error('Error sending message to webhook:', err))
})

// Handle contacts
client.on('ready', async () => {
  console.log('Client is ready!')
  channel.speak({ message: 'client is ready!' })

  // Send 'client is ready' message to the webhook URL
  const readyData = { message: 'client is ready!' }

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readyData)
  })
    .then((res) => res.text())
    .then((text) => console.log('Ready message sent to webhook:', text))
    .catch((err) => console.error('Error sending ready message to webhook:', err))

  const contacts = await client.getContacts()

  contacts.forEach((contact) => {
    const data = {
      key: contact.id._serialized,
      contact
    }

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then((res) => res.text())
      .then((text) => console.log('Contact sent to webhook:', text))
      .catch((err) => console.error('Error sending contact to webhook:', err))
  })
})

const run = async () => {
  client.initialize()
}

run().catch(console.error)
