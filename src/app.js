const { Client, LocalAuth } = require('whatsapp-web.js');
const KafkaProducer = require('./kafkaProducer');
const qrcode = require('qrcode-terminal');
const ActionCable = require('@rails/actioncable');

// Get the WebSocket URL from the environment variable
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;

// Initialize the Kafka Producer 
const producer = KafkaProducer();

// Create ActionCable consumer
const cable = ActionCable.createConsumer(WEBSOCKET_URL);

cable.connection.onerror = (error) => {
  console.error('ActionCable connection error:', error);
};

// Subscribe to the channel
const whatsappChannel = cable.subscriptions.create('WhatsappChannel', {
  connected() {
    console.log('Connected to ActionCable server:', WEBSOCKET_URL);
  },
  disconnected() {
    console.log('Disconnected from ActionCable server');
  },
  received(data) {
    console.log('Received data from ActionCable:', data);
  }
});

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

  // Send the QR code to the ActionCable server
  whatsappChannel.send({ qr_code: qr });
  console.log('QR code sent to ActionCable server');
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
      messages: [{ key: message.from, value: JSON.stringify(message) }]
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
        messages: [{ key: contact.id._serialized, value: JSON.stringify(contact) }]
      })
      .catch(console.error);
  });
});

client.initialize();
