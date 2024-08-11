const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 메시지 저장소
let messages = [];

io.on('connection', (socket) => {
  console.log('New client connected');

  // 클라이언트가 초기 메시지를 요청할 때 초기화된 메시지를 보냄
  socket.on('requestInitialMessages', () => {
    console.log('requestInitialMessages received'); // 디버그 로그 추가
    const initialMessages = []; // 채팅 로그를 초기화합니다.
    messages = initialMessages; // messages 배열을 초기화합니다.
    socket.emit('initialMessages', initialMessages);
  });

  socket.on('message', (message) => {
    messages.push(message);
    io.emit('message', message); // 모든 클라이언트에 메시지를 전송합니다.
  });

  socket.on('likeMessage', (messageId) => {
    messages = messages.map(msg => 
      msg.id === messageId ? { ...msg, likes: msg.likes + 1 } : msg
    );
    io.emit('updateMessages', messages);
  });

  socket.on('dislikeMessage', (messageId) => {
    messages = messages.map(msg => 
      msg.id === messageId ? { ...msg, dislikes: msg.dislikes + 1 } : msg
    );
    io.emit('updateMessages', messages);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

