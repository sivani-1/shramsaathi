import axios from "axios";

const API = "http://localhost:8083/api";

export const chatService = {
  sendMessage: async (msg) => {
    const res = await axios.post(`${API}/chat`, msg);
    return res.data;
  },

  getMessages: async (applicationId) => {
    const res = await axios.get(`${API}/chat/${applicationId}`);
    return res.data;
  },
};
