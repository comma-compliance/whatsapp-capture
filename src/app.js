// app.js
import './sentry.js'
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import { Cable, createCable } from '@anycable/core';
import ChatChannel from './channels/chat.js'
import WebSocket from 'ws';
import fetch from 'node-fetch';

// Get the WebSocket URL from the environment variable
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;

// Define the Webhook URL
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://100.95.55.44:3000/webhooks/incoming/whatsapp_webhooks/';

// Create ActionCable consumer
const cable = ActionCable.createConsumer(WEBSOCKET_URL);

cable.connection.onerror = (error) => {
  console.error('ActionCable connection error:', error);
};

// Subscribe to the channel
console.log('Subscribing to the chat channel', WEBSOCKET_URL)
const channel = new ChatChannel()
consumer.subscribe(channel)

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
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Generate and display QR code for authentication
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
  console.log('QR RECEIVED', qr);

  // Send the QR code to the AnyCable server
  channel.speak({ qr_code: qr });
  console.log('QR code sent to AnyCable server');

  // Send the QR code to the webhook URL
  // const data = { qr_code: qr };

  // fetch(WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // })
  //   .then((res) => res.text())
  //   .then((text) => console.log('QR code sent to webhook:', text))
  //   .catch((err) => console.error('Error sending QR code to webhook:', err));
});

// When authenticated
client.on('authenticated', () => {
  console.log('AUTHENTICATED');
  channel.speak({message: "AUTHENTICATED"});

  // Send a message to the webhook URL
  // const data = { message: 'AUTHENTICATED' };

  // fetch(WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // })
  //   .then((res) => res.text())
  //   .then((text) => console.log('Authenticated message sent to webhook:', text))
  //   .catch((err) => console.error('Error sending authenticated message to webhook:', err));
});

// Handle new messages
client.on('message', async (message) => {
  console.log('MESSAGE RECEIVED:', message.body);

  // Send the message to the webhook URL
  const data = {
    key: message.from,
    message: message,
  };

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((res) => res.text())
    .then((text) => console.log('Message sent to webhook:', text))
    .catch((err) => console.error('Error sending message to webhook:', err));
});

// Handle contacts
client.on('ready', async () => {
  console.log('Client is ready!');
  channel.speak({message: "client is ready!"})

  // Send 'client is ready' message to the webhook URL
  const readyData = { message: 'client is ready!' };

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(readyData),
  })
    .then((res) => res.text())
    .then((text) => console.log('Ready message sent to webhook:', text))
    .catch((err) => console.error('Error sending ready message to webhook:', err));

  const contacts = await client.getContacts();

  contacts.forEach((contact) => {
    const data = {
      key: contact.id._serialized,
      contact: contact,
    };

    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.text())
      .then((text) => console.log('Contact sent to webhook:', text))
      .catch((err) => console.error('Error sending contact to webhook:', err));
  });
});

const run = async () => {
  client.initialize();
}

run().catch(console.error)
