import axios from "axios";

const API_BASE = "http://localhost:8083/api/chat";

export const chatService = {
  sendMessage: async (messageData) => {
    const res = await axios.post(API_BASE, messageData);
    return res.data;
  },

  getMessages: async (applicationId) => {
    const res = await axios.get(`${API_BASE}/${applicationId}`);
    return res.data;
  },
};
