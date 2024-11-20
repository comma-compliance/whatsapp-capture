// anycable.js
import { createCable } from '@anycable/core'
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws'
import { WEBSOCKET_URL, JOB_ID } from './config.js'
import { latestQRCode } from './state.js'
import { stopWhatsAppClient } from './whatsappClient.js'

export const consumer = createCable(WEBSOCKET_URL, {
  websocketImplementation: WebSocket
})

console.log('Subscribing to the WebSocket server', WEBSOCKET_URL)

export const channel = new ChatChannel({ room_id: JOB_ID })
consumer.subscribe(channel)

// Event handlers for AnyCable
channel.on('connect', (msg) => console.log(`Connected to anycable ${JSON.stringify(msg)}`))

channel.on('message', (msg) => {
  console.log('MESSAGE RECEIVED:', JSON.stringify(msg))
  const data = typeof msg === 'string' ? JSON.parse(msg) : msg

  if (data.type === 'disconnect') {
    console.log('Disconnect message received. Shutting down WhatsApp client.')
    stopWhatsAppClient()
  } else if (data.type === 'request_qr_code' && latestQRCode) {
    // Send the latest QR code as a response
    channel.speak({ qr_code: latestQRCode })
    console.log('QR code sent to the user')
  } else {
    console.log(`${data.name || 'Server'}: ${data.text || JSON.stringify(data)}`)
  }
})

channel.on('typing', (msg) => console.log(`User ${JSON.stringify(msg)} is typing`))
channel.on('close', () => console.log('close from WebSocket server'))
channel.on('disconnect', () => console.log('disconnect from WebSocket connection'))

// Connect the consumer
consumer.connect()
