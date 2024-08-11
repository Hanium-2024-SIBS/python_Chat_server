import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

const socket = io('http://localhost:4000');

const userImages = [
  'https://i.pravatar.cc/150?img=2'

];

const userNames = ['User3'];

const bannedWords = ['씨발'];

function ChatRoom() {
  const dummy = useRef();
  const chatContainerRef = useRef();
  const [messages, setMessages] = useState([]);
  const [formValue, setFormValue] = useState('');
  const [userId] = useState(uuidv4());
  const [userImage] = useState(userImages[Math.floor(Math.random() * userImages.length)]);
  const [userName] = useState(userNames[Math.floor(Math.random() * userNames.length)]);
  const [dislikedUsers, setDislikedUsers] = useState(new Set());
  const [likedUsers, setLikedUsers] = useState(new Set());

  useEffect(() => {
    socket.emit('requestInitialMessages');
    console.log('requestInitialMessages sent');

    socket.on('initialMessages', (initialMessages) => {
      console.log('initialMessages received', initialMessages);
      setMessages(initialMessages);
      setDislikedUsers(new Set());
      setLikedUsers(new Set());
    });

    socket.on('message', (message) => {
      setMessages((messages) => [message, ...messages]);
      if (message.dislikes >= 30) {
        setDislikedUsers(prev => new Set(prev).add(message.uid));
      }
      if (message.likes >= 30) {
        setLikedUsers(prev => new Set(prev).add(message.uid));
      }
    });

    socket.on('updateMessages', (updatedMessages) => {
      setMessages(updatedMessages);
      updatedMessages.forEach(message => {
        if (message.dislikes >= 30) {
          setDislikedUsers(prev => new Set(prev).add(message.uid));
        }
        if (message.likes >= 30) {
          setLikedUsers(prev => new Set(prev).add(message.uid));
        }
      });
    });

    return () => {
      socket.off('initialMessages');
      socket.off('message');
      socket.off('updateMessages');
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();

    const containsBannedWord = bannedWords.some(word => formValue.includes(word));
    if (containsBannedWord) {
      const warningMessage = {
        id: uuidv4(),
        text: `${userName}의 채팅이 차단되었습니다`,
        createdAt: new Date(),
        uid: "system",
        photoURL: "",
        userName: "SIBS✅",
        likes: 0,
        dislikes: 0,
        isWarning: true
      };
      setMessages((messages) => [warningMessage, ...messages]);
      setFormValue('');
      return;
    }

    const newMessage = {
      id: uuidv4(),
      text: formValue,
      createdAt: new Date(),
      uid: userId,
      photoURL: userImage,
      userName: userName,
      likes: 0,
      dislikes: 0
    };

    socket.emit('message', newMessage);
    setFormValue('');
  };

  const handleLike = (id) => {
    socket.emit('likeMessage', id);
  };

  const handleDislike = (id) => {
    socket.emit('dislikeMessage', id);
  };

  return (
    <div className="App">
      <header>
        <h1>채팅방</h1>
        <span className="material-icons settings-icon">
          settings
        </span>
      </header>
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((msg, index) => 
          <ChatMessage 
            key={index} 
            message={msg} 
            onLike={() => handleLike(msg.id)} 
            onDislike={() => handleDislike(msg.id)} 
            dislikedUsers={dislikedUsers}
            likedUsers={likedUsers}
          />
        )}
        <span ref={dummy}></span>
      </div>
      <form onSubmit={sendMessage}>
        <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="채팅을 입력해주세요" />
        <button type="submit">보내기</button>
      </form>
    </div>
  );
}

function ChatMessage({ message, onLike, onDislike, dislikedUsers, likedUsers }) {
  const { text, photoURL, userName, likes, dislikes, uid, isWarning } = message;

  return (
    <div className={`message ${userName === "SIBS✅" ? "system-message" : ""}`}>
      {photoURL && <img src={photoURL} alt="User Avatar" />}
      <div className="message-content">
        <div className="message-header">
          <div className="username" style={{ color: likes >= 30 ? '#99f77c' : dislikedUsers.has(uid) ? 'red' : 'black' }}>{userName}</div>
        </div>
        <p style={{ color: isWarning ? 'red' : 'black' }}>{text}</p>
        {userName !== "SIBS✅" && (
          <div className="message-actions">
            <button onClick={onLike}>👍 {likes}</button>
            <button onClick={onDislike}>👎 {dislikes}</button>
            <button>번역</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatRoom;
