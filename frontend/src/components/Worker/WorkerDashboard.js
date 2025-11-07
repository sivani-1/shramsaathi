import React, { useState, useEffect } from "react";
import axios from "axios";
import ChatModal from "./ChatModal";
import "./WorkerDashboard.css";

const API_BASE = "http://localhost:8083/api";

const WorkerDashboard = () => {
  const workerId = 1; // ⚠️ Replace with actual logged-in workerId later

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [workerProfile, setWorkerProfile] = useState({
    name: "Rama",
    skill: "Electrician",
    location: "Hyderabad",
    contact: "9876543210",
  });

  const [activeTab, setActiveTab] = useState("jobs");
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [message, setMessage] = useState("");
  const [chatApplication, setChatApplication] = useState(null);

  // ✅ Fetch all jobs
  useEffect(() => {
    axios.get(`${API_BASE}/jobs`).then((res) => setJobs(res.data));
  }, []);

  // ✅ Fetch worker applications
  const fetchApplications = async () => {
    const res = await axios.get(`${API_BASE}/applications/worker/${workerId}`);
    setApplications(res.data);

    // Mark already applied job IDs
    const appliedIds = new Set(res.data.map((app) => app.jobId));
    setAppliedJobs(appliedIds);
  };

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  // ✅ Apply for a job (protected against duplicates)
  const handleApply = async (job) => {
    try {
      const response = await axios.post(`${API_BASE}/applications`, {
        jobId: job.id,
        workerId,
        workerName: workerProfile.name,
        workerSkill: workerProfile.skill,
        status: "pending",
      });

      setMessage(response.data.message || "✅ Applied successfully!");
      setAppliedJobs((prev) => new Set(prev.add(job.id)));
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setMessage("⚠️ You’ve already applied for this job.");
      } else {
        setMessage("❌ Failed to apply. Try again.");
      }
    }

    setTimeout(() => setMessage(""), 3000);
  };

  // ✅ Profile update handler
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setWorkerProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = () => {
    setMessage("✅ Profile updated successfully!");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="worker-dashboard">
      <header className="worker-header">
        <h1>👷 Worker Dashboard</h1>
        <p>Find jobs, apply, and manage your profile easily</p>
      </header>

      {/* Feedback Message */}
      {message && <div className="alert-msg">{message}</div>}

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "jobs" ? "tab active" : "tab"}
          onClick={() => setActiveTab("jobs")}
        >
          🔍 Available Jobs
        </button>
        <button
          className={activeTab === "applications" ? "tab active" : "tab"}
          onClick={() => setActiveTab("applications")}
        >
          📄 My Applications
        </button>
        <button
          className={activeTab === "profile" ? "tab active" : "tab"}
          onClick={() => setActiveTab("profile")}
        >
          👤 My Profile
        </button>
      </div>

      {/* JOBS TAB */}
      {activeTab === "jobs" && (
        <div className="jobs-container">
          {jobs.length === 0 ? (
            <p className="empty-msg">No jobs available right now.</p>
          ) : (
            <table className="jobs-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Skill Needed</th>
                  <th>Location</th>
                  <th>Pay</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.skillNeeded}</td>
                    <td>{job.location}</td>
                    <td>{job.pay}</td>
                    <td>{job.duration}</td>
                    <td>
                      {appliedJobs.has(job.id) ? (
                        <button className="applied-btn" disabled>
                          ✅ Applied
                        </button>
                      ) : (
                        <button
                          className="apply-btn"
                          onClick={() => handleApply(job)}
                        >
                          Apply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {activeTab === "applications" && (
        <div className="applications-container">
          {applications.length === 0 ? (
            <p className="empty-msg">You haven’t applied for any jobs yet.</p>
          ) : (
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Pay</th>
                  <th>Status</th>
                  <th>Applied On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.jobTitle || `Job #${app.jobId}`}</td>
                    <td>{app.location}</td>
                    <td>{app.pay}</td>
                    <td>
                      <span
                        className={`status ${
                          app.status === "accepted"
                            ? "accepted"
                            : app.status === "rejected"
                            ? "rejected"
                            : "pending"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>
                      {app.status === "accepted" && (
                        <button
                          className="apply-btn"
                          onClick={() => setChatApplication(app)}
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
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="profile-container">
          <h2>🧾 Edit Profile</h2>
          <div className="profile-form">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={workerProfile.name}
              onChange={handleProfileChange}
            />
            <label>Skill</label>
            <input
              type="text"
              name="skill"
              value={workerProfile.skill}
              onChange={handleProfileChange}
            />
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={workerProfile.location}
              onChange={handleProfileChange}
            />
            <label>Contact</label>
            <input
              type="text"
              name="contact"
              value={workerProfile.contact}
              onChange={handleProfileChange}
            />
            <button className="save-btn" onClick={handleProfileSave}>
              💾 Save Profile
            </button>
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {chatApplication && (
        <ChatModal
          applicationId={chatApplication.id}
          workerId={workerId}
          onClose={() => setChatApplication(null)}
        />
      )}
    </div>
  );
};

export default WorkerDashboard;
