import React, { useEffect, useState } from "react";
import axios from "axios";
import ChatModal from "../Worker/ChatModal"; // ✅ adjust path if needed
import "./ApplicationsPanel.css";

const API_BASE = "http://localhost:8083/api";

const ApplicationsPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openChatFor, setOpenChatFor] = useState(null); // ✅ chat modal state

  // ✅ 1. Fetch all jobs for this owner
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/jobs/owner/1`); // ownerId = 1 (temporary)
        const jobsData = res.data;

        // Add application counts
        const jobsWithCounts = await Promise.all(
          jobsData.map(async (job) => {
            try {
              const appRes = await axios.get(`${API_BASE}/applications/job/${job.id}`);
              return { ...job, applicationCount: appRes.data.length };
            } catch {
              return { ...job, applicationCount: 0 };
            }
          })
        );

        setJobs(jobsWithCounts);
        if (jobsWithCounts.length > 0) setSelectedJobId(jobsWithCounts[0].id);
      } catch (err) {
        console.error("Error fetching jobs:", err);
      }
    };
    fetchJobs();
  }, []);

  // ✅ 2. Fetch applications for selected job
  useEffect(() => {
    if (!selectedJobId) return;

    const fetchApplications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/applications/job/${selectedJobId}`);
        setApplications(res.data);
      } catch (err) {
        console.error("Error fetching applications:", err);
      }
      setLoading(false);
    };

    fetchApplications();
  }, [selectedJobId]);

  // ✅ 3. Handle accept/reject
  const updateStatus = async (appId, status) => {
    try {
      await axios.put(`${API_BASE}/applications/${appId}/status?status=${status}`);
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="applications-container">
      <h2 className="title">📩 Job Applications</h2>
      <p className="subtitle">Manage all job requests from one panel</p>

      {/* ✅ Job dropdown */}
      <div className="job-selector">
        <label>Select Job:</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title} ({job.applicationCount} applications)
            </option>
          ))}
        </select>
      </div>

      {/* ✅ Table */}
      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <p className="empty-msg">No applications for this job yet.</p>
      ) : (
        <table className="applications-table">
          <thead>
            <tr>
              <th>Worker Name</th>
              <th>Skill</th>
              <th>Applied On</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.workerName || "Unnamed Worker"}</td>
                <td>{app.workerSkill || "N/A"}</td>
                <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`status ${app.status?.toLowerCase()}`}>
                    {app.status}
                  </span>
                </td>
                <td>
                  <button
                    className="accept-btn"
                    onClick={() => updateStatus(app.id, "ACCEPTED")}
                  >
                    Accept
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => updateStatus(app.id, "REJECTED")}
                  >
                    Reject
                  </button>

                  {/* ✅ Chat Button only if accepted */}
                  {app.status === "ACCEPTED" && (
                    <button
                      className="chat-btn"
                      onClick={() => setOpenChatFor(app)}
                    >
                      💬 Chat
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ✅ Chat Modal */}
      {openChatFor && (
        <ChatModal
          applicationId={openChatFor.id}
          meId={1} // logged-in owner (temporary)
          otherId={openChatFor.workerId}
          onClose={() => setOpenChatFor(null)}
        />
      )}
    </div>
  );
};

export default ApplicationsPanel;
