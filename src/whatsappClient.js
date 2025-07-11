// whatsappClient.js

import { Client } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import { getAuthStrategy } from './authStrategy.js'
import { channel } from './anycable.js'
import { setLatestQRCode, latestQRCode } from './state.js'
import { sendWebhook, sendContactsWebhook, encryptMessage } from './helpers.js'
import { runWhatsappClient } from './index.js'
import { SYSTEM_IDENTIFIERS, JOB_ID, CONTACTS_BATCH_SIZE, CONTACTS_DELAY } from './config.js'
require('log-timestamp')

let clientInstance = null
let qrCount = 1

export function initializeWhatsAppClient (reauth = false) {
  const authStrategy = getAuthStrategy()

  const client = new Client({
    authStrategy,
    puppeteer: {
      args: [
              '--no-sandbox', '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-features=site-per-process',
              '--js-flags="--expose-gc"',
              '--single-process',
              '--no-zygote',
              '--memory-pressure-off'
            ]
    }
  })

  clientInstance = client

  // Generate and display QR code for authentication
  client.on('qr', (qr) => {
    setLatestQRCode(qr) // Store the latest QR code
    qrcode.generate(qr, { small: true })
    console.log('QR Count is', qrCount)
    console.log('QR RECEIVED', qr)

    // Reload client if qrcount is 6
    if (qrCount > 5 || qr.includes("undefined")) {
      qrCount = 1
      channel.speak({ error: "Something went wrong please wait for the QR code to appear then try scanning QR code again" })
      reloadClient()
    } else {
      // Send the QR code to the AnyCable server
      qrCount = qrCount + 1
      channel.speak({ qr_code: qr })
      console.log('QR code sent to AnyCable server')
    }
  })

  // When authenticated
  client.on('authenticated', () => {
    console.log('AUTHENTICATED')
  })

  // When disconnected
  client.on('disconnected', () => {
    console.log('DISCONNECTED')
  })

  client.on('remote_session_saved', () => {
    console.log('Remote session saved')
    channel.speak({ message: 'Remote session saved' })
  })

  // Handle new messages
  client.on('message_create', async (message) => {
    if (message.isStatus) return

    let mediaData = null;
    const chat_id = message?.id?.remote
    if (chat_id?.includes("@g.us")) {
      const chat = await client.getChatById(chat_id)
      message.participants = chat?.participants
      message.isGroup = true
    } else if (chat_id?.includes("@c.us")) {
      const reciever_contact = await client.getContactById(message.to);
      message.reciever_name = reciever_contact.name || reciever_contact.pushname
      message.reciever_phone = reciever_contact.number
      message.isGroup = false
    }
    if (message.hasMedia && message.type == 'image') {

      const media = await message.downloadMedia();
      mediaData = `data:${media.mimetype};base64,${media.data}`;
    } else if (!message.body) {
      return; // Return if no media and body is empty
    }

    console.log('MESSAGE RECEIVED:', "****")

    // Send the message to the webhook URL
    const data = {
      key: message.from,
      message: {
          ...message,
          mediaData: mediaData
      },
      job_id: JOB_ID
    };

    let encrypted_data = await encryptMessage(JSON.stringify(data));
    encrypted_data = {
      ...encrypted_data,
      // If message recieved from any of the system worker identifier
      system_worker_identifier: SYSTEM_IDENTIFIERS.some(identifier => message.from?.includes(identifier)),
    };

    sendWebhook(encrypted_data)

    mediaData = null;
    message = null;

    if (global.gc) {
      global.gc(); // Force garbage collection
    }
  })

  // Handle contacts
  client.on('ready', async () => {
    const info = client.info
    if (latestQRCode) {
      const profilePicUrl = await client.getProfilePicUrl(info.me._serialized);
      const userInfo = { sender_identifier: info.me.user, sender_name: info.pushname, phone: info.me.user, business: false, avatar: profilePicUrl }
      console.log('Client is ready!')
      channel.speak({ message: 'Client is ready!' })
      let contacts
      if (reauth) {
        channel.send({ type: 'reauthenticate' , user_info: userInfo})
      } else {
        channel.speak({ whatsapp_authed: true, user_info: userInfo})
        contacts = await client.getContacts() // https://docs.wwebjs.dev/Contact.html
        console.log(`Total contacts: ${contacts.length}`);
        sendInBatches(client, contacts, CONTACTS_BATCH_SIZE, CONTACTS_DELAY);
      }
      contacts = null
    }
  })

  return client
}

async function sendInBatches(client, contacts, batchSize, delay) {
  for (let i = 0; i < contacts.length; i += batchSize) {
    let batch = contacts.slice(i, i + batchSize);
    console.log(`Sent batch length ${batch.length}`);

    // Fetch avatars for all contacts in the batch concurrently
    let batchData = await Promise.all(
      batch.map(async (contact) => {
        if (contact.id?._serialized?.endsWith('@lid') ||
            contact.id?._serialized?.endsWith('@g.us')) { return null }

        let numberDetails = null;
        let avatar = null;
        try {
          numberDetails = await client.getNumberId(contact.id._serialized);
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (numberDetails) avatar = await client.getProfilePicUrl(contact.id._serialized);
        } catch (error) {
          console.error('Error fetching profile picture of:', contact.id);
        }

        let contact_data = {
          data: {
            key: contact.id._serialized,
            avatar,
            contact
          },
          job_id: JOB_ID
        }

        let encrypted_contact = await encryptMessage(JSON.stringify(contact_data));
        return {
          contact: {
            data: encrypted_contact
          }
        };
      })
    );
    // **Remove null/undefined values before sending**
    let filteredBatchData = batchData.filter(Boolean); // Removes all falsy values

    if (filteredBatchData.length > 0) {
      sendContactsWebhook(filteredBatchData);
      batchData = null
      batch = null
      filteredBatchData = null
    } else {
      console.log("Skipping webhook: No valid contacts to send.");
    }

    console.log(`Sent batch ${Math.floor(i / batchSize) + 1}`);

    if (i + batchSize < contacts.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  contacts = null
  batchSize = null

  if (global.gc) {
    global.gc(); // Force garbage collection
  }
}

export async function reloadClient () {
  await clientInstance
      .destroy()
      .then(() => {
        console.log('WhatsApp client has been destroyed restarting client.')
        channel.speak({ reauthenticate: true});
        runWhatsappClient(true)
      })
}

export function stopWhatsAppClient () {
  if (clientInstance) {
    clientInstance
      .logout()
      .then(() => {
        console.log('WhatsApp client has been logged out.')
        return clientInstance.destroy()
      })
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

export async function wrongAccountScanned() {
  if (!clientInstance) {
    console.log("No client instance to destroy");
    return;
  }

  try {
    await clientInstance.logout();
    console.log("WhatsApp client is logout.");
  } catch (error) {
    console.error("Error destroying WhatsApp client:", error);
  }

  clientInstance = null; // Clear the global ref to avoid confusion
  runWhatsappClient(true)
}
