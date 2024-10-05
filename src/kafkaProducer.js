import { Kafka } from 'kafkajs';

const kafkaBroker = process.env.KAFKA_URL;

// Kafka Producer Setup
export default function KafkaProducer() {
    const kafka = new Kafka({
        clientId: 'whatsapp-producer',
        brokers: [kafkaBroker]
    });

    const producer = kafka.producer();
    const runProducer = async () => {
        await producer.connect();
        console.log('Kafka Producer connected!');
    };

    runProducer().catch(console.error);

    return producer;
};
