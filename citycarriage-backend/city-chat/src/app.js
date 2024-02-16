const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const connectDB = require("./DB/index.js");
const { Message } = require("./DB/Models/messageModel.js");
const { Kafka, logLevel } = require("kafkajs");
const multer = require("multer");
const path = require("path");

const port = process.env.PORT || 9200;

const app = express();

// Store authenticated users and their sockets
const authenticatedUsers = new Map(); // <-- Move the declaration here

connectDB();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
  res.status(200).json("Welcome to city-carriage chat live");
});

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: ["localhost:9092"],
  logLevel: logLevel.INFO,
});

const uploadsPath = path.join(__dirname, "..", "uploads/");
console.log(uploadsPath);
app.use("/uploads", express.static(uploadsPath));
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "chat-app-group" });

const offlineMessages = new Map();

async function run() {
  await producer.connect();
  await consumer.connect();

  await consumer.subscribe({ topic: "private-messages" });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const { from, to, content } = JSON.parse(message.value.toString());

      // Emit message to both sender and receiver
      if (authenticatedUsers.has(from)) {
        authenticatedUsers
          .get(from)
          .emit("privateMessage", { from, to, message: content.message });
      }
      if (authenticatedUsers.has(to)) {
        authenticatedUsers
          .get(to)
          .emit("privateMessage", { from, to, message: content.message });
      } else {
        // If the receiver is offline, store the message for later delivery
        if (!offlineMessages.has(to)) {
          offlineMessages.set(to, []);
        }
        offlineMessages.get(to).push({ from, content });
        // Save the message to MongoDB for persistence
        await Message.create({
          rideID: content.rideID,
          message: content.message,
        });
      }
    },
  });
}

run().catch(console.error);

// IMAGE UPLOAD
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

io.on("connection", (socket) => {
  socket.on("authenticate", async (data) => {
    console.log("CHAT SOCKET CONNECTED HERE");
    const { userId, rideID } = data;
    console.log(data, "check data from frontend ");
    console.log(`${userId} Joined the Chat`);
    authenticatedUsers.set(userId, socket);

    // Check if there are offline messages for this user and deliver them
    if (offlineMessages.has(userId)) {
      const messages = offlineMessages.get(userId);
      messages.forEach((msg) => {
        socket.emit("privateMessage", {
          from: msg.from,
          to: userId,
          message: msg.content,
        });
      });
      offlineMessages.delete(userId); // Clear offline messages after delivering
    }

    try {
      const existingConversation = await Message.findOne({ rideID });
      console.log("existingConversation", existingConversation);
      if (existingConversation) {
        // const messages = existingConversation.message;
        //messages.forEach((msg) => {
        socket.emit("privateMessage", {
          from: userId,
          to: userId,
          message: existingConversation.message,
        });
        //});
      }
    } catch (error) {
      console.error(error);
    }

    // Retrieve chat history from MongoDB and send it to the user based on rideID
    // Message.find({ rideID: userId })
    //   .then((messages) => {

    //       socket.emit('privateMessage', { from: userId, to: userId, message: msg.message });

    //   })
    //   .catch((error) => {
    //     console.error(error);
    //   });
  });

  app.post("/sendToKafka", express.json(), async (req, res) => {
    const { from, to, rideID, message } = req.body;

    try {
      const MessageObject = {
        from,
        to,
        message,
      };

      console.log(
        `MESSAGE SEND BY [${from} to [${to} and message is [${message}]]`
      );

      let existingConversation = await Message.findOne({ rideID });

      if (!existingConversation) {
        // If the conversation doesn't exist, create a new one
        existingConversation = await Message.create({
          rideID: rideID,
          message: [MessageObject],
        });
      } else {
        console.log("coversation exits");
        // If the conversation already exists, push the new message to it and save
        existingConversation.message.push(MessageObject);
        await existingConversation.save();
      }

      await producer.send({
        topic: "private-messages",
        messages: [
          {
            value: JSON.stringify({ from, to, content: existingConversation }),
          },
        ],
      });

      res.status(200).json({ message: "Message sent" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to send message to Kafka" });
    }
  });

  // ... (your other socket event handlers)

  socket.on("disconnect", () => {
    for (const [userId, userSocket] of authenticatedUsers) {
      if (userSocket === socket) {
        authenticatedUsers.delete(userId);
      }
    }
  });
});

// ... (your other routes)

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
