// index.js

import './sentry.js'
import { JOB_ID } from './config.js'
import { initializeWhatsAppClient } from './whatsappClient.js'

console.log('JOB_ID:', JOB_ID)

// Initialize the WhatsApp client
const client = initializeWhatsAppClient()

// Run the client
const run = async () => {
  client.initialize()
}

run().catch(console.error)
