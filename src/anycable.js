// websocket.js

import { createCable } from '@anycable/core'
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws'
import { WEBSOCKET_URL, JOB_ID } from './config.js'
import { latestQRCode } from './state.js'

export const consumer = createCable(WEBSOCKET_URL, {
  websocketImplementation: WebSocket
})

console.log('Subscribing to the WebSocket server', WEBSOCKET_URL)

export const channel = new ChatChannel({ room_id: JOB_ID })
consumer.subscribe(channel)

// Event handlers for AnyCable
channel.on('connect', (msg) =>
  console.log(`Connected ${msg.name}: ${msg.text}`)
)

channel.on('message', (msg) => {
  console.log('MESSAGE RECEIVED:', msg)
  // Check if the message is requesting the current QR code
  if (msg.text?.toLowerCase() === 'request_qr_code' && latestQRCode) {
    // Send the latest QR code as a response
    channel.speak({ qr_code: latestQRCode })
    console.log('QR code sent to the user')
  } else {
    console.log(`${msg.name}: ${msg.text}`)
  }
})

channel.on('typing', (msg) =>
  console.log(`User ${msg.name} is typing`)
)
channel.on('close', () =>
  console.log('Disconnected from WebSocket server')
)
channel.on('disconnect', () =>
  console.log('No WebSocket connection')
)

// Connect the consumer
consumer.connect()
