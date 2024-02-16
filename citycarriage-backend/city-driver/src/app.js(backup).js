const express = require('express');
const mongoose = require('mongoose');
const { Kafka } = require('kafkajs');

const app = express();
const port = 3000;

// MongoDB setup
mongoose.connect('mongodb+srv://suitchdeveloper:LLFMHCsP472L!@cluster0.ilxk0.mongodb.net/kafka', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Message = mongoose.model('Message', { content: String });

// Kafka setup
const kafka = new Kafka({
  clientId: 'kafka-mongodb-api',
  brokers: ['localhost:9092'],
});
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

const run = async () => {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: 'messages', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const content = message.value.toString();
      const newMessage = new Message({ content });
      await newMessage.save();
      console.log(`Received message: ${content}`);
    },
  });
};

run().catch(console.error);

// Express API
app.use(express.json());

app.post('/driver/location', async (req, res) => {
  const { content } = req.body;
  await producer.send({
    topic: 'messages',
    messages: [{ value: content }],
  });
  res.status(201).json({ message: 'Message sent to Kafka' });
});

app.get('/driver/location', async (req, res) => {
  const messages = await Message.find();
  res.json(messages);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
