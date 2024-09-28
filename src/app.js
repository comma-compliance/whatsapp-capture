const { Client, LocalAuth } = require('whatsapp-web.js');
const KafkaProducer = require('./kafkaProducer');
const qrcode = require('qrcode-terminal');
const WebSocket = require('ws');

// Get the WebSocket URL from the environment variable
const WEBSOCKET_URL = process.env.WEBSOCKET_URL;

// Initialize the Kafka Producer
const producer = KafkaProducer();

// Connect to the WebSocket server
let ws;
if (WEBSOCKET_URL) {
    ws = new WebSocket(WEBSOCKET_URL);

    ws.on('open', function open() {
        console.log('Connected to WebSocket server:', WEBSOCKET_URL);
    });

    ws.on('error', function error(err) {
        console.error('WebSocket connection error:', err);
    });
} else {
    console.error('WEBSOCKET_URL is not defined');
}

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Generate and display QR code for authentication
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR RECEIVED', qr);

    // Send the QR code to the WebSocket server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'whatsapp_qr', qr_code: qr }));
        console.log('QR code sent to WebSocket server');
    } else {
        console.error('WebSocket is not open. Could not send QR code');
    }
});

// When authenticated
client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

// Handle new messages
client.on('message', async message => {
    console.log('MESSAGE RECEIVED:', message.body);

    // Send the message to Kafka
    producer.send({
        topic: 'whatsapp-messages',
        messages: [
            { key: message.from, value: JSON.stringify(message) }
        ],
    }).catch(console.error);
});

// Handle contacts
client.on('ready', async () => {
    console.log('Client is ready!');
    const contacts = await client.getContacts();

    contacts.forEach(contact => {
        producer.send({
            topic: 'whatsapp-contacts',
            messages: [
                { key: contact.id._serialized, value: JSON.stringify(contact) }
            ],
        }).catch(console.error);
    });
});

client.initialize();
