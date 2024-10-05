// app.js

import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import KafkaProducer from './kafkaProducer.js';
import qrcode from 'qrcode-terminal';
import { Cable, createCable } from '@anycable/core';
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws';

// Get the WebSocket URL from the environment variable
const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://rails-app:3000/cable?token=this_should_never_be_in_prod';

// Initialize the Kafka Producer
const producer = KafkaProducer();

// Create AnyCable consumer
const consumer = createCable(WEBSOCKET_URL, {
  websocketImplementation: WebSocket,
});

// Subscribe to the channel
console.log('Subscribing to the chat channel', WEBSOCKET_URL)
const channel = new ChatChannel()
consumer.subscribe(channel)
await channel.ensureSubscribed()

channel.on('connect', msg => console.log(`connected ${msg.name}: ${msg.text}`))
channel.on('message', msg => console.log(`${msg.name}: ${msg.text}`))

// Handle custom typing messages
channel.on('typing', msg => console.log(`User ${msg.name} is typing`))

// Or subscription close events
channel.on('close', () => console.log('Disconnected from chat'))

// Or temporary disconnect
channel.on('disconnect', () => console.log('No chat connection'))

// Connect the consumer
consumer.connect();

// WhatsApp Client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

// Generate and display QR code for authentication
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('QR RECEIVED', qr);

  // Send the QR code to the AnyCable server
  channel.speak({ qr_code: qr });
  console.log('QR code sent to AnyCable server');
});

// When authenticated
client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

// Handle new messages
client.on('message', async (message) => {
  console.log('MESSAGE RECEIVED:', message.body);

  // Send the message to Kafka
  producer
    .send({
      topic: 'whatsapp-messages',
      messages: [{ key: message.from, value: JSON.stringify(message) }],
    })
    .catch(console.error);
});

// Handle contacts
client.on('ready', async () => {
  console.log('Client is ready!');
  const contacts = await client.getContacts();

  contacts.forEach((contact) => {
    producer
      .send({
        topic: 'whatsapp-contacts',
        messages: [
          { key: contact.id._serialized, value: JSON.stringify(contact) },
        ],
      })
      .catch(console.error);
  });
});

client.initialize();
