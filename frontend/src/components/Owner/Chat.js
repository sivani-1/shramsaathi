import { useEffect, useState } from "react";
import { chatService } from "../../services/chatService";
import { subscribe } from "../../services/socketService";
import "./Chat.css";

const Chat = ({ applicationId, ownerId, workerId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // ✅ Fetch messages initially
  useEffect(() => {
    const fetch = async () => {
      const data = await chatService.getMessages(applicationId);
      setMessages(data);
    };
    fetch();

    // Subscribe to real-time chat updates
    const sub = subscribe(`/user/${applicationId}/queue/messages`, (msg) => {
      const transformedMsg = {
        ...msg,
        message: msg.content
      };
      setMessages((prev) => [...prev, transformedMsg]);
    });
    return () => sub.unsubscribe();
  }, [applicationId]);

  // ✅ Send new message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    await chatService.sendMessage({
      applicationId,
      senderId: ownerId,
      receiverId: workerId,
      message: newMessage,
      senderType: "OWNER",
    });
    setNewMessage("");
  };

  return (
    <div className="chat-overlay">
      <div className="chat-modal">
        <div className="chat-header">
          <h3>💬 Chat with Worker</h3>
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
                  msg.senderId === ownerId ? "sent" : "received"
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

export default Chat;
