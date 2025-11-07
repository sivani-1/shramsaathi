import axios from "axios";

const API_BASE_URL = "http://localhost:8083/api";

export const jobService = {
  // ✅ Get all jobs
  getAllJobs: async () => {
    const res = await axios.get(`${API_BASE_URL}/jobs`);
    return res.data;
  },

  // ✅ Add a new job
  addJob: async (jobData) => {
    const res = await axios.post(`${API_BASE_URL}/jobs`, jobData);
    return res.data;
  },

  // ✅ Delete a job
  deleteJob: async (jobId) => {
    await axios.delete(`${API_BASE_URL}/jobs/${jobId}`);
  },
};
