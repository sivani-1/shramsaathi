import { useEffect, useState } from "react";
import { chatService } from "../../services/chatService";
import { subscribe } from "../../services/socketService";
import "./ChatModal.css";

const ChatModal = ({ applicationId, workerId, ownerId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

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

    try {
      await chatService.sendMessage({
        applicationId,
        senderId: workerId,
        receiverId: ownerId,
        message: newMessage,
        senderType: "WORKER",
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
    setNewMessage("");
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
