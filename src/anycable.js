// anycable.js
import { createCable } from '@anycable/core'
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws'
import { WEBSOCKET_URL, JOB_ID } from './config.js'
import { latestQRCode } from './state.js'
import { stopWhatsAppClient, sendMessage, wrongAccountScanned } from './whatsappClient.js'
import { encryptMessage, decryptMessage } from './helpers.js'

export const consumer = createCable(WEBSOCKET_URL, {
  websocketImplementation: WebSocket
})

console.log('Subscribing to the WebSocket server', WEBSOCKET_URL)

export let channel = null

export function setupChannel () {
  channel = new ChatChannel({ room_id: JOB_ID })
  consumer.subscribe(channel)

  // Event handlers for AnyCable
  channel.on('connect', (msg) => console.log(`Connected to anycable ${JSON.stringify(msg)}`))

  channel.on('message', async (msg) => {
    msg = msg.nonce ? decryptMessage(msg) : msg;
    console.log('MESSAGE RECEIVED:', "****")
    const data = typeof msg === 'string' ? JSON.parse(msg) : msg

    if (data.type === 'disconnect') {
      console.log('Disconnect message received. Shutting down WhatsApp client.')
      stopWhatsAppClient()
    } else if (data.type === 'request_qr_code' && latestQRCode) {
      // Send the latest QR code as a response
      channel.speak(encryptMessage({ qr_code: latestQRCode }))
      console.log('QR code sent to the user')
    } else if (data.type === 'channel_diconnect') {
      channel.disconnect()
    } else if (data.type === 'outbound_message') {
      // send the message via whatsapp to the specified phone number
      console.log('Sending message:', "****")
      const resp = await sendMessage(data.info.phone_number, data.info.message)

      channel.speak({ message_sent: true, response: resp })
    } else if (data.type === 'wrong_account_scanned') {
      console.log('Authuntication failed wrong credentials provided')
      wrongAccountScanned()
    }
  })

  channel.on('typing', (msg) => console.log(`User ${JSON.stringify(msg)} is typing`))

  channel.on('close', () => {
    console.log('close from WebSocket server Retrying to connect....')
    setTimeout(() => {
      // Wait a bit before reconnecting to avoid rapid reconnection loops
      setupConnection()
    }, 1000)
  })

  channel.on('disconnect', () => console.log('disconnect from WebSocket connection'))
}

function setupConnection() {
  try {
    // Disconnect from any existing connection first
    consumer.disconnect()

    // Set up a new channel
    setupChannel()

    // Connect the consumer
    consumer.connect()
  } catch (error) {
    console.error('Error during reconnection:', error)
    // Try again after a delay
    setTimeout(setupConnection, 5000)
  }
}

setupConnection()
