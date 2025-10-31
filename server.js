const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
   },
});

let users = {}; 

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('register', (username) => {
    if (!username) return;
    users[username] = socket.id;
    console.log(`${username} connected`);
    
    io.emit('users', Object.keys(users));
  });

  socket.on('private_message', ({ sender, recipient, message }) => {
    const recipientSocket = users[recipient];
    if (recipientSocket) {
      io.to(recipientSocket).emit('receive_message', { sender, message });
      console.log(`${sender}-${recipient}: ${message}`);
      
    } else {
      console.log(`Recipient ${recipient} not found or offline`);
      
    }
  });

  socket.on('disconnect', () => {
    console.log("A user disconnected:", socket.id);
    
    for (const [username, id] of Object.entries(users)) {
      if (id === socket.id) {
        delete users[username];
        io.emit('users', Object.keys(users));
        console.log(`${username} removed from users`);
        break;
    }
  }
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));
