import axios from "axios";
import { useEffect, useState } from "react";
import "./ApplicationsPanel.css";
import Chat from "./Chat";

const API_BASE = "http://localhost:8083/api";

const ApplicationsPanel = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  // Filters
  // Use empty strings so placeholders are visible; parse to numbers when filtering
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [filterPincode, setFilterPincode] = useState("");
  const [showAll, setShowAll] = useState(false); // debug: show all applications ignoring filters
  const [openChatFor, setOpenChatFor] = useState(null);
  const [message, setMessage] = useState(""); // For feedback messages

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

  // ✅ 2. Fetch applications for selected job and enrich with worker profiles
  const fetchApplications = async () => {
    if (!selectedJobId) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/applications/job/${selectedJobId}`);
      const apps = res.data || [];

      // Collect unique workerIds and fetch their profiles in parallel
      const workerIds = [...new Set(apps.map((a) => a.workerId).filter(Boolean))];
      const workersById = {};

      if (workerIds.length > 0) {
        const workerResponses = await Promise.all(
          workerIds.map(async (id) => {
            try {
              const response = await axios.get(`${API_BASE}/users/${id}`);
              console.log(`Fetched worker ${id}:`, response.data); // Debug log
              return { id, data: response.data };
            } catch (e) {
              console.error(`Failed to load user ${id}:`, e);
              return { id, data: null };
            }
          })
        );

        workerResponses.forEach((wr) => {
          if (wr && wr.id != null && wr.data) {
            workersById[wr.id] = wr.data;
            console.log(`Stored worker ${wr.id} in workersById:`, wr.data); // Debug log
          }
        });
      }

      // Attach workerProfile to each application object
      const enriched = apps.map((app) => {
        const profile = workersById[app.workerId];
        console.log(`Enriching application for worker ${app.workerId}:`, profile); // Debug log
        return { ...app, workerProfile: profile || null };
      });

      setApplications(enriched);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setMessage("Failed to load applications. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedJobId]);

  // ✅ 3. Handle accept/reject with automatic rejection of other applications
  const updateStatus = async (appId, status) => {
    try {
      const app = applications.find(a => a.id === appId);
      if (!app) {
        setMessage("❌ Application not found");
        return;
      }

      if (status === "ACCEPTED") {
        // Check if this application is already accepted
        if (app.status.toLowerCase() === "accepted") {
          setMessage("✓ This worker is already accepted");
          return;
        }

        // Check if any other application is already accepted
        const alreadyAccepted = applications.find(
          a => a.status.toLowerCase() === "accepted" && a.id !== appId
        );

        if (alreadyAccepted) {
          setMessage(`⚠️ Cannot accept. ${alreadyAccepted.workerName} is already accepted for this job`);
          return;
        }

        // Accept this worker
        await axios.put(`${API_BASE}/applications/${appId}/status?status=${status}`);
        setMessage(`✅ Accepted ${app.workerName}'s application`);

        // Reject all other pending applications
        const othersToReject = applications.filter(
          a => a.id !== appId && a.status.toLowerCase() === "pending"
        );

        if (othersToReject.length > 0) {
          await Promise.all(
            othersToReject.map(a => 
              axios.put(`${API_BASE}/applications/${a.id}/status?status=REJECTED`)
            )
          );
        }

        // Refresh applications to show updated statuses
        await fetchApplications();
      } else if (status === "REJECTED") {
        if (app.status.toLowerCase() === "accepted") {
          setMessage("⚠️ Cannot reject an accepted worker. Accept another worker first if you want to change.");
          return;
        }

        await axios.put(`${API_BASE}/applications/${appId}/status?status=${status}`);
        setMessage(`Rejected ${app.workerName}'s application`);
        await fetchApplications();
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setMessage("❌ Failed to update application status. Please try again.");
    }

    // Clear message after 3 seconds
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="applications-container">
      <h2 className="title">📩 Job Applications</h2>
      <p className="subtitle">Manage all job requests from one panel</p>

      {/* Status Message */}
      {message && (
        <div className={`message ${message.startsWith("❌") ? "error" : message.startsWith("⚠️") ? "warning" : "success"}`}>
          {message}
        </div>
      )}

      {/* ✅ Job dropdown */}
      <div className="job-selector">
        <label>Select Job:</label>
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
        >
          {jobs.map((job) => {
            const acceptedCount = applications.filter(
              app => app.jobId === job.id && app.status.toLowerCase() === "accepted"
            ).length;
            
            return (
              <option key={job.id} value={job.id}>
                {job.title} ({job.applicationCount} applications
                {acceptedCount > 0 ? `, ${acceptedCount} accepted` : ""})
              </option>
            );
          })}
        </select>
      </div>

      {/* Debug / info line */}
      <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ color: '#374151', fontSize: 14 }}>
          Apps: {applications.length} • Profiles: {applications.filter(a => !!a.workerProfile).length}
        </div>
        <label style={{ fontSize: 13, color: '#374151' }}>
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} style={{ marginRight: 6 }} />
          Show all (ignore filters)
        </label>
        <div style={{ fontSize: 13, color: '#6b7280' }}>
          Tip: open browser Console to see "Fetched worker &lt;id&gt;:" logs for profile data
        </div>
      </div>

      {/* Filters for worker listing */}
      <div className="filter-row" style={{ marginTop: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ marginRight: 8, fontWeight: 600 }}>Filters</label>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Min age"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            style={{ width: 96 }}
          />
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Max age"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            style={{ width: 96 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Min exp (yrs)"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            style={{ width: 120 }}
          />
          <input
            className="filter-input"
            type="number"
            min={0}
            placeholder="Max exp (yrs)"
            value={maxExperience}
            onChange={(e) => setMaxExperience(e.target.value)}
            style={{ width: 120 }}
          />
        </div>

        <input
          className="filter-input"
          type="text"
          placeholder="Pincode (partial allowed)"
          value={filterPincode}
          onChange={(e) => setFilterPincode(e.target.value)}
          style={{ width: 150, marginLeft: 8 }}
        />

        <button className="reset-btn" onClick={() => { setMinAge(""); setMaxAge(""); setMinExperience(""); setMaxExperience(""); setFilterPincode(""); }}>
          Reset
        </button>
      </div>

      {/* ✅ Table */}
      {(() => {
        // compute filtered applications here (keeps JSX tidy)
        const filteredApplications = applications.filter((app) => {
          const p = app.workerProfile;

          // parse numeric filter values (empty string => inactive)
          const parseNum = (v) => {
            const n = Number(v);
            return isNaN(n) ? null : n;
          };

          const minAgeNum = parseNum(minAge);
          const maxAgeNum = parseNum(maxAge);
          const minExpNum = parseNum(minExperience);
          const maxExpNum = parseNum(maxExperience);

          const anyFilterActive = (minAgeNum !== null) || (maxAgeNum !== null) || (minExpNum !== null) || (maxExpNum !== null) || (filterPincode && filterPincode.trim() !== "");
          if (!p && anyFilterActive) return false;

          if (p) {
            const ageNum = Number(p.age);
            const expNum = Number(p.experienceYears ?? p.experience);

            if (minAgeNum !== null && (isNaN(ageNum) || ageNum < minAgeNum)) return false;
            if (maxAgeNum !== null && (isNaN(ageNum) || ageNum > maxAgeNum)) return false;

            if (minExpNum !== null && (isNaN(expNum) || expNum < minExpNum)) return false;
            if (maxExpNum !== null && (isNaN(expNum) || expNum > maxExpNum)) return false;

            const pincodeStr = String(p.pincode ?? p.pin ?? "").trim();
            if (filterPincode && pincodeStr.indexOf(String(filterPincode).trim()) === -1) return false;
          }

          return true;
        });

  // If debug 'showAll' is checked, bypass filters and show every application
  const finalApplications = showAll ? applications : filteredApplications;
  const resultsCount = finalApplications.length;

  if (loading) return <p>Loading applications...</p>;
  if (resultsCount === 0) return <p className="empty-msg">No applications match the current filters.</p>;

        return (
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
              {finalApplications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div className="worker-main">
                      <div className="worker-name">
                        {(app.workerProfile && app.workerProfile.name) || app.workerName || "Unnamed Worker"}
                      </div>
                      {app.workerProfile ? (
                        <div className="worker-details">
                          {app.workerProfile.phone && <div>📞 {app.workerProfile.phone}</div>}
                          {app.workerProfile.address && <div>🏠 {app.workerProfile.address}</div>}
                          {(app.workerProfile.area || app.workerProfile.colony || app.workerProfile.pincode) && (
                            <div>📍 {`${app.workerProfile.area || ''}${app.workerProfile.colony ? ', ' + app.workerProfile.colony : ''}${app.workerProfile.pincode ? ', ' + app.workerProfile.pincode : ''}`}</div>
                          )}
                          {(app.workerProfile.workType || app.workerProfile.skill) && (
                            <div>🛠️ {app.workerProfile.workType || app.workerProfile.skill}</div>
                          )}
                          {app.workerProfile.age != null && <div>🎂 Age: {app.workerProfile.age}</div>}
                          {app.workerProfile.experienceYears != null && <div>📈 Exp: {app.workerProfile.experienceYears} yrs</div>}
                        </div>
                      ) : (
                        <div className="worker-details">No profile available</div>
                      )}
                    </div>
                  </td>
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
        );
      })()}

      {/* ✅ Chat Modal */}
      {openChatFor && (
        <Chat
          applicationId={openChatFor.id}
          ownerId={1} // logged-in owner (temporary)
          workerId={openChatFor.workerId}
          onClose={() => setOpenChatFor(null)}
        />
      )}
    </div>
  );
};

export default ApplicationsPanel;
