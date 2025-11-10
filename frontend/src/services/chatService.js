import axios from "axios";
import { send } from "./socketService";

const API_BASE = "http://localhost:8083/api/chat";

export const chatService = {
  sendMessage: async (messageData) => {
    // Transform to match backend format
    const message = {
      applicationId: messageData.applicationId,
      senderId: messageData.senderId,
      receiverId: messageData.receiverId || null, // make receiverId optional
      message: messageData.message
    };
    
    // Send via WebSocket for real-time updates
    send("/app/chat", message);
    
    // Also persist via REST
    const res = await axios.post(API_BASE, message);
    return res.data;
  },

  getMessages: async (applicationId) => {
    const res = await axios.get(`${API_BASE}/${applicationId}`);
    // Transform response to match frontend format
    return res.data.map(msg => ({
      applicationId: msg.applicationId,
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      message: msg.message,
      sentAt: msg.sentAt
    }));
  },
};
