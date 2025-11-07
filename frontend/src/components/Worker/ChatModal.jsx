import React, { useEffect, useState } from "react";
import { chatService } from "../../services/chatService";
import "./ChatModal.css";

const ChatModal = ({ applicationId, workerId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Fetch messages initially and refresh every 3s
  const fetchMessages = async () => {
    const data = await chatService.getMessages(applicationId);
    setMessages(data);
  };

  useEffect(() => {
  const fetch = async () => await fetchMessages();
  fetch();

  const interval = setInterval(fetchMessages, 3000);
  return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [applicationId]);

  // ✅ Send new message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await chatService.sendMessage({
      applicationId,
      senderId: workerId,
      receiverId: 999, // 👈 placeholder for owner ID
      message: newMessage,
    });
    setNewMessage("");
    fetchMessages();
  };

  return (
    <div className="chat-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <h3>💬 Chat with Owner</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-body">
          {messages.length === 0 ? (
            <p className="empty-msg">No messages yet.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`message-bubble ${
                  msg.senderId === workerId ? "sent" : "received"
                }`}
              >
                {msg.message}
              </div>
            ))
          )}
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
