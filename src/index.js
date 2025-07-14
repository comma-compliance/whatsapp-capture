// index.js

import './sentry.js'
import { initializeWhatsAppClient } from './whatsappClient.js'
import { channel } from './anycable.js'
export const state = { reauth: false };

export function runWhatsappClient () {
  // Initialize the WhatsApp client
  const client = initializeWhatsAppClient()

  // Run the client
  const run = async () => {
    console.log('Initializing WhatsApp client')
    await client.initialize()
  }

  run().catch(async(err) => {
    console.error("Error recieved from client: ", err)
    const isUserDisconnect = err.message.includes("Execution context was destroyed, most likely because of a navigation.");

    if (isUserDisconnect) {
      try {
        await client.destroy();
        console.log("WhatsApp client is disconnected.");
        channel.speak({ reauthenticate: true});
        state.reauth = true; 
        runWhatsappClient();
      } catch (destroyErr) {
        console.error("Error destroying client:", destroyErr);
      }
    } else {
      console.log("Error not related to user disconnect, skipping destroy.");
    }
  })
}

runWhatsappClient()
