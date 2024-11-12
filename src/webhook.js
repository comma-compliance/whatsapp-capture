// webhook.js
import './sentry'
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

import qrcode from 'qrcode-terminal';
import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://100.95.55.44:3000/webhooks/incoming/whatsapp_webhooks/';

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

  // Send the QR code to the webhook URL
  const data = { qr_code: qr };

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((res) => res.text())
    .then((text) => console.log('QR code sent to webhook:', text))
    .catch((err) => console.error('Error sending QR code to webhook:', err));
});

// When authenticated
client.on('authenticated', () => {
  console.log('AUTHENTICATED');
  // Send a message to the webhook URL
  const data = { message: 'AUTHENTICATED' };

  fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((res) => res.text())
    .then((text) => console.log('Authenticated message sent to webhook:', text))
    .catch((err) => console.error('Error sending authenticated message to webhook:', err));
});

// Handle new messages
client.on('message', async (message) => {
  console.log('MESSAGE RECEIVED:', message.body);

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

  // Get contacts
  const contacts = await client.getContacts();

  // Send contacts to the webhook URL
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
};

run().catch((e) => Sentry.captureException(e));
