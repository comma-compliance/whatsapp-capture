// index.js

import './sentry.js'
import { JOB_ID } from './config.js'
import { initializeWhatsAppClient } from './whatsappClient.js'
import { channel } from './anycable.js'

console.log('JOB_ID:', JOB_ID)
export function runWhatsappClient (reauth = false) {
  // Initialize the WhatsApp client
  const client = initializeWhatsAppClient(reauth)

  // Run the client
  const run = async () => {
    console.log('Initializing WhatsApp client')
    await client.initialize()
  }

  run().catch(async(err) => {
    console.error("Error recieved from client: ", err)

    try {
      await client.destroy();
      console.log("WhatsApp client is disconnected.");
    } catch (destroyErr) {
      console.error("Error destroying client:", destroyErr);
    }
    channel.speak({ reauthenticate: true});
    runWhatsappClient(true);
  })
}

runWhatsappClient()
