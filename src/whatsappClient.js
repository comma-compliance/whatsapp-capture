// whatsappClient.js

import { Client } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { getAuthStrategy } from './authStrategy.js'
import { channel } from './anycable.js'
import { setLatestQRCode } from './state.js'
import { sendWebhook } from './helpers.js'
require('log-timestamp')

let clientInstance = null

export function initializeWhatsAppClient () {
  const authStrategy = getAuthStrategy()

  const client = new Client({
    authStrategy,
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  })

  clientInstance = client

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
  })

  client.on('remote_session_saved', () => {
    console.log('Remote session saved')
    channel.speak({ message: 'Remote session saved' })
  })

  // Handle new messages
  client.on('message_create', async (message) => {
    let mediaData = null;

    if (message.hasMedia) {
      const media = await message.downloadMedia();
      mediaData = `data:${media.mimetype};base64,${media.data}`;
    }

    console.log('MESSAGE RECEIVED:', message.body) // https://docs.wwebjs.dev/Message.html

    // Send the message to the webhook URL
    const data = {
      key: message.from,
      message: {
          ...message,
          mediaData: mediaData
      }
  };

    sendWebhook(data)
  })

  // Handle contacts
  client.on('ready', async () => {
    const info = client.info
    console.log('Client info:', client.info)
    const userInfo = { sender_identifier: info.me.user, sender_name: info.pushname, phone: info.me.user, business: false }
    channel.speak({ whatsapp_authed: true, user_info: userInfo })
    console.log('Client is ready!')
    channel.speak({ message: 'Client is ready!' })

    const contacts = await client.getContacts() // https://docs.wwebjs.dev/Contact.html

    // get the avatar pic and include in payload - getProfilePicUrl()
    contacts.forEach(async (contact) => {
      const avatar = await client.getProfilePicUrl(contact.id._serialized)
      const data = {
        key: contact.id._serialized,
        avatar,
        contact
      }

      sendWebhook(data)
    })
  })

  return client
}

export function stopWhatsAppClient () {
  if (clientInstance) {
    clientInstance
      .destroy()
      .then(() => {
        console.log('WhatsApp client has been stopped.')
        channel.send({ message: 'WhatsApp client has been stopped.', type: 'disconnected' })
      })
      .catch((err) => {
        channel.send({ type: 'failed' })
        console.error('Error stopping WhatsApp client:', err)
      })
  } else {
    console.log('No WhatsApp client instance to stop.')
  }
}

// phoneNumber WITH COUNTRY CODE
export async function sendMessage (phoneNumber, message) {
  if (clientInstance) {
    const sanitizedNumber = phoneNumber.toString().replace(/[- )(]/g, '') // remove unnecessary chars from the number
    const numberDetails = await clientInstance.getNumberId(sanitizedNumber) // get mobile number details from whatsapp

    if (numberDetails) {
      const sendMessageData = await clientInstance.sendMessage(numberDetails._serialized, message) // send message
      return sendMessageData
    } else {
      console.log(sanitizedNumber, 'Mobile number is not registered')
    }
  } else {
    console.log('No WhatsApp client instance to send message.')
  }
}
