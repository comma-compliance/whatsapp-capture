// whatsappClient.js

import { Client } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { getAuthStrategy } from './authStrategy.js'
import { channel } from './anycable.js'
import { setLatestQRCode } from './state.js'
import { sendWebhook } from './helpers.js'

export function initializeWhatsAppClient () {
  const authStrategy = getAuthStrategy()

  const client = new Client({
    authStrategy,
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  // Generate and display QR code for authentication
  client.on('qr', (qr) => {
    setLatestQRCode(qr) // Store the latest QR code
    qrcode.generate(qr, { small: true })
    console.log('QR RECEIVED', qr)

    // Send the QR code to the AnyCable server
    channel.speak({ qr_code: qr })
    console.log('QR code sent to AnyCable server')
  })

  // When authenticated
  client.on('authenticated', () => {
    console.log('AUTHENTICATED')
    channel.speak({ whatsapp_authed: true }) // TODO: pass phone number/account details
  })

  client.on('remote_session_saved', () => {
    console.log('Remote session saved')
    channel.speak({ message: 'Remote session saved' })
  })

  // Handle new messages
  client.on('message', async (message) => {
    console.log('MESSAGE RECEIVED:', message.body)

    // Send the message to the webhook URL
    const data = {
      key: message.from,
      message
    }

    sendWebhook(data)
  })

  // Handle contacts
  client.on('ready', async () => {
    console.log('Client is ready!')
    channel.speak({ message: 'Client is ready!' })

    const contacts = await client.getContacts()

    contacts.forEach((contact) => {
      const data = {
        key: contact.id._serialized,
        contact
      }

      sendWebhook(data)
    })
  })

  return client
}
