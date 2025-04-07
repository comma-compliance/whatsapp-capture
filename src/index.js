// index.js

import './sentry.js'
import { JOB_ID } from './config.js'
import { initializeWhatsAppClient } from './whatsappClient.js'

console.log('JOB_ID:', JOB_ID)
export function runWhatsappClient () {
  // Initialize the WhatsApp client
  const client = initializeWhatsAppClient()

  // Run the client
  const run = async () => {
    console.log('Initializing WhatsApp client')
    await client.initialize()
  }

  run().catch((err) => {
    console.error("Error recieved from client: ", err)
    if (err.message?.includes("Target closed.")) {
      console.error("Restarting client now....")
      runWhatsappClient()
    }
    
  })
}

runWhatsappClient()
