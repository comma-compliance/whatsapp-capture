const { Client, LocalAuth } = require('whatsapp-web.js');
const KafkaProducer = require('./kafkaProducer');
const qrcode = require('qrcode-terminal');

// Initialize the Kafka Producer
const producer = KafkaProducer();

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
