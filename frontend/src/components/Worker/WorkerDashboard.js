import axios from "axios";
import { useEffect, useState } from "react";
import { connect as wsConnect, disconnect as wsDisconnect, send as wsSend, subscribe as wsSubscribe } from "../../services/socketService";
import ChatModal from "./ChatModal";
import RouteMap from "./RouteMap";
import "./WorkerDashboard.css";

const API_BASE = "http://localhost:8083/api";

const WorkerDashboard = () => {
  // workerId should come from auth/session. Make it stateful so we can set it
  // after creating/saving the profile. Initially null until known.
  const [workerId, setWorkerId] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [workerProfile, setWorkerProfile] = useState({
    name: "Rama",
    skill: "Electrician",
    location: "Hyderabad",
    contact: "9876543210",
    // worker pincode (used to geocode worker origin). Replace with real data for logged-in user.
    area: "",
    colony: "",
    state: "",
    pincode: "500081",
    age: "",
    experienceYears: "",
  });

  const [activeTab, setActiveTab] = useState("jobs");
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [message, setMessage] = useState("");
  const [chatApplication, setChatApplication] = useState(null);
  const [routeTarget, setRouteTarget] = useState(null); // [lat, lng]
  const [showRoute, setShowRoute] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeOriginInfo, setRouteOriginInfo] = useState(null);
  const [routeDestInfo, setRouteDestInfo] = useState(null);
  const [routeKey, setRouteKey] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [modalPincode, setModalPincode] = useState("");

  // Geocode a postal code (pincode) to lat/lon using Nominatim (OpenStreetMap).
  // Geocode a location (area/colony/state/pincode/location string) using Nominatim.
  // Tries a few query formats and returns [lat, lon] or null on failure.
  const geocodeLocation = async ({ area, colony, state, pincode, text }) => {
    const base = "https://nominatim.openstreetmap.org/search";
    const cleanP = pincode ? String(pincode).trim() : "";

    const queries = [];
    // prefer most specific: area + colony + pincode + state
    if (area || colony || cleanP || state) {
      let parts = [];
      if (area) parts.push(area);
      if (colony) parts.push(colony);
      if (cleanP) parts.push(cleanP);
      if (state) parts.push(state);
      parts.push("India");
      queries.push(parts.filter(Boolean).join(", "));
    }

    // pincode + India
    if (cleanP) queries.push(`${cleanP}, India`);

    // free text fallback
    if (text) queries.push(`${text} India`);

    // last resort: just the pincode (no country)
    if (cleanP) queries.push(cleanP);

    try {
      for (const q of queries) {
        const params = { format: "json", limit: 1, addressdetails: 1, q, countrycodes: "in" };
        const res = await axios.get(base, { params });
        if (res.data && res.data.length > 0) {
          const r = res.data[0];
          const lat = parseFloat(r.lat);
          const lon = parseFloat(r.lon);
          // Validate result lies roughly within India bounding box
          if (lat >= 6 && lat <= 38 && lon >= 68 && lon <= 98) {
            return [lat, lon];
          }
          // if address country_code present, prefer only India
          if (r.address && r.address.country_code && r.address.country_code.toLowerCase() === "in") {
            return [lat, lon];
          }
          // otherwise continue to next query
        }
      }
      return null;
    } catch (err) {
      console.error("Geocode error", err);
      return null;
    }
  };

  // ✅ Fetch all jobs and enrich with owner information
  const fetchJobs = async () => {
    try {
      const jobsRes = await axios.get(`${API_BASE}/jobs`);

      // If workerId is known, fetch applications for this worker; otherwise assume none
      let applicationsRes = { data: [] };
      if (workerId) {
        try {
          applicationsRes = await axios.get(`${API_BASE}/applications/worker/${workerId}`);
        } catch (e) {
          console.warn('Failed to fetch worker applications (will assume none):', e);
          applicationsRes = { data: [] };
        }
      }

      // Mark which jobs worker has already applied to
      const appliedIds = new Set((applicationsRes.data || []).map(app => app.jobId));
      setAppliedJobs(appliedIds);

      // Enrich jobs with application status
      const enrichedJobs = jobsRes.data.map(job => ({
        ...job,
        alreadyApplied: appliedIds.has(job.id),
        applicationStatus: applicationsRes.data.find(app => app.jobId === job.id)?.status || null
      }));

      setJobs(enrichedJobs);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setMessage('⚠️ Failed to load jobs. Please try again.');
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchJobs();
    // connect websocket once
    try { wsConnect(); } catch (e) {}
  }, []);

  // Re-fetch jobs when workerId becomes available so applied flags are correct
  useEffect(() => {
    if (workerId) fetchJobs();
  }, [workerId]);

  // ✅ Fetch worker applications with full owner information
  const fetchApplications = async () => {
    try {
      if (!workerId) {
        setApplications([]);
        setMessage("⚠️ Save your profile first so applications can be linked to your account.");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      // Get applications and jobs in parallel for efficiency
      const [applicationsRes, jobsRes] = await Promise.all([
        axios.get(`${API_BASE}/applications/worker/${workerId}`),
        axios.get(`${API_BASE}/jobs`)
      ]);
      
      // Create a lookup of jobs by ID for efficient access
      const jobsById = {};
      jobsRes.data.forEach(job => {
        jobsById[job.id] = job;
      });

      // Combine application data with complete job and owner data
      const enrichedApplications = applicationsRes.data.map(app => {
        const relatedJob = jobsById[app.jobId] || {};
        return {
          ...app,
          jobTitle: relatedJob.title || `Job #${app.jobId}`,
          location: relatedJob.location || app.location || 'Unknown Location',
          pay: relatedJob.pay || app.pay || 'Pay not specified',
          // Complete owner information from the job
          ownerId: relatedJob.ownerId,
          ownerName: relatedJob.ownerName,
          ownerPincode: relatedJob.pincode,
          ownerArea: relatedJob.area,
          ownerColony: relatedJob.colony,
          ownerState: relatedJob.state
        };
      });

      console.log("Enriched Applications with owner info:", enrichedApplications); // For debugging
      setApplications(enrichedApplications);

      // Update applied jobs set
      const appliedIds = new Set(enrichedApplications.map((app) => app.jobId));
      setAppliedJobs(appliedIds);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setMessage('Failed to load applications. Please try again.');
    }
  };

  useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    }
  }, [activeTab]);

  // ✅ Apply for a job (protected against duplicates)
  const handleApply = async (job) => {
    try {
      // Ensure worker has a backend id. If not, save profile first.
      if (!workerId) {
        const savedId = await handleProfileSave();
        if (!savedId) {
          setMessage('⚠️ Please save your profile before applying.');
          setTimeout(() => setMessage(''), 3000);
          return;
        }
      }

      const response = await axios.post(`${API_BASE}/applications`, {
        jobId: job.id,
        workerId,
        workerName: workerProfile.name,
        workerSkill: workerProfile.skill,
        status: "pending",
      });

      // Debug: log server response for apply action
      console.log('POST /api/applications response:', response && response.data ? response.data : response);

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

  const handleProfileSave = async () => {
    // Persist worker profile to backend (upsert via UserController)
    try {
      const payload = {
        name: workerProfile.name || "",
        phone: workerProfile.contact || "",
        address: workerProfile.location || "",
        workType: workerProfile.skill || "",
        // backend requires district/mandal (UserRequest validation). Use placeholder if missing.
        district: workerProfile.district || "Unknown",
        mandal: workerProfile.mandal || "Unknown",
        pincode: workerProfile.pincode ? parseInt(String(workerProfile.pincode).trim(), 10) : 0,
        area: workerProfile.area || "",
        colony: workerProfile.colony || "",
        state: workerProfile.state || "",
        age: workerProfile.age ? parseInt(String(workerProfile.age), 10) : null,
        experienceYears: workerProfile.experienceYears ? parseInt(String(workerProfile.experienceYears), 10) : null,
      };

      const res = await axios.post(`${API_BASE}/users`, payload);
      if (res && res.data) {
        setMessage("✅ Profile saved to server.");
        // If backend returned an id, use it as workerId for future actions
        if (res.data.id) {
          setWorkerId(res.data.id);
          return res.data.id;
        }
      } else {
        setMessage("✅ Profile updated locally.");
      }
    } catch (err) {
      console.error('Profile save failed', err);
      // show friendly fallback message
      setMessage("⚠️ Could not save profile to server. Saved locally.");
    }

    setTimeout(() => setMessage(""), 3000);
    return null;
  };

  // Start sharing worker's browser geolocation to the backend via STOMP
  const startSharingLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }
    if (isSharing) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // publish to backend
        wsSend(`/app/location/${workerId}`, { workerId, lat, lon, timestamp: Date.now() });
      },
      (err) => console.error('geo error', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    setWatchId(id);
    setIsSharing(true);
  };

  const stopSharingLocation = () => {
    if (watchId != null) navigator.geolocation.clearWatch(watchId);
    setWatchId(null);
    setIsSharing(false);
    try { wsDisconnect(); } catch (e) {}
  };

  // Subscribe to real-time location topic for this worker (updates can come from other clients)
  useEffect(() => {
    const sub = wsSubscribe(`/topic/location/${workerId}`, (msg) => {
      try {
        const body = msg; // socketService already JSON-parses
        if (body && body.lat && body.lon) {
          setRouteOrigin([body.lat, body.lon]);
          // if showing route, update key to force remount
          setRouteKey(Date.now());
        }
      } catch (e) {}
    });
    return () => { if (sub) sub.unsubscribe(); };
  }, []);

  // Modal handlers
  const openPincodeModal = (onSubmit) => {
    setShowPincodeModal(true);
  };
  const submitPincodeModal = () => {
    setShowPincodeModal(false);
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className={job.alreadyApplied ? "applied-row" : ""}>
                    <td>{job.title}</td>
                    <td>{job.skillNeeded}</td>
                    <td>
                      {job.location}
                      {job.area && <div className="location-detail">Area: {job.area}</div>}
                      {job.colony && <div className="location-detail">Colony: {job.colony}</div>}
                    </td>
                    <td>₹{job.pay}</td>
                    <td>{job.duration} days</td>
                    <td>
                      {job.alreadyApplied ? (
                        <span className={`status ${job.applicationStatus?.toLowerCase()}`}>
                          {job.applicationStatus}
                        </span>
                      ) : (
                        <span className="status available">Available</span>
                      )}
                    </td>
                    <td>
                      {job.alreadyApplied ? (
                        <button className="applied-btn" disabled>
                          ✅ Already Applied
                        </button>
                      ) : (
                        <button
                          className="apply-btn"
                          onClick={() => handleApply(job)}
                        >
                          Apply Now
                        </button>
                      )}
                      {/* Show route button: uses job.pincode (owner) and workerProfile.pincode to geocode and show route */}
                      <div style={{ marginTop: 6 }}>
                        <button
                          className="route-btn"
                          onClick={async () => {
                            const ownerPcode = job.pincode || job.postalCode || job.zip || job.postalcode;
                            let destCoords = null;
                            try {
                              setRouteLoading(true);
                              if (ownerPcode) destCoords = await geocodeLocation({ area: job.area, colony: job.colony, state: job.state, pincode: ownerPcode, text: job.location });
                              else {
                                const entered = window.prompt("Enter owner pincode / postal code (e.g. 500081)");
                                if (entered) destCoords = await geocodeLocation({ pincode: entered, text: entered });
                              }

                              if (!destCoords) {
                                alert("Could not resolve owner pincode to coordinates.");
                                return;
                              }

                              // worker pincode from profile or prompt
                              const workerPcode = workerProfile.pincode || window.prompt("Enter your pincode (worker)");
                              if (!workerPcode) {
                                alert("Worker pincode required to show route.");
                                return;
                              }

                              const originCoords = await geocodeLocation({ area: workerProfile.area, colony: workerProfile.colony, state: workerProfile.state, pincode: workerPcode, text: workerProfile.location });
                              if (!originCoords) {
                                alert("Could not resolve your pincode to coordinates.");
                                return;
                              }

                              // set origin/destination coords and info (area/colony/state/pincode)
                              setRouteOrigin(originCoords);
                              setRouteTarget(destCoords);
                              // force RouteMap remount so previous maps don't linger
                              setRouteKey(Date.now());
                              setRouteOriginInfo({
                                area: workerProfile.area || "",
                                colony: workerProfile.colony || "",
                                state: workerProfile.state || "",
                                pincode: workerPcode,
                              });
                              setRouteDestInfo({
                                area: job.area || "",
                                colony: job.colony || "",
                                state: job.state || "",
                                pincode: ownerPcode,
                              });
                              setShowRoute(true);
                            } finally {
                              setRouteLoading(false);
                            }
                          }}
                        >
                          {routeLoading ? "Loading…" : "🗺️ Show Route"}
                        </button>
                      </div>
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
                          app.status.toLowerCase() === "accepted"
                            ? "accepted"
                            : app.status.toLowerCase() === "rejected"
                            ? "rejected"
                            : "pending"
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                    <td>
                      {app.status && app.status.toLowerCase() === "accepted" && (
                        <div className="action-buttons">
                          <button
                            className="chat-btn"
                            onClick={() => {
                              console.log("Opening chat for application:", app); // For debugging
                              if (!app.ownerId) {
                                setMessage("⚠️ Unable to start chat - This job's owner information is not available");
                                setTimeout(() => setMessage(""), 3000);
                                return;
                              }
                              setChatApplication(app);
                            }}
                            title={app.ownerId ? "Click to chat with job owner" : "Owner information not available"}
                          >
                            {app.ownerId ? "💬 Chat with Owner" : "⚠️ Chat Unavailable"}
                          </button>
                          <button
                            className="route-btn"
                            style={{ marginLeft: 8 }}
                              onClick={async () => {
                                const pcode = app.ownerPincode || app.ownerPostalCode || app.ownerZip || app.pincode || app.postalCode;
                                let destCoords = null;
                                try {
                                  setRouteLoading(true);
                                  if (pcode) destCoords = await geocodeLocation({ area: app.ownerArea || app.area, colony: app.ownerColony || app.colony, state: app.ownerState || app.state, pincode: pcode, text: app.location || app.jobTitle });
                                  else {
                                    const entered = window.prompt("Enter owner pincode / postal code (e.g. 500081)");
                                    if (entered) destCoords = await geocodeLocation({ pincode: entered, text: entered });
                                  }

                                  if (!destCoords) {
                                    alert("Could not resolve owner pincode to coordinates.");
                                    return;
                                  }

                                  const workerPcode = workerProfile.pincode || window.prompt("Enter your pincode (worker)");
                                  if (!workerPcode) {
                                    alert("Worker pincode required to show route.");
                                    return;
                                  }

                                  const originCoords = await geocodeLocation({ area: workerProfile.area, colony: workerProfile.colony, state: workerProfile.state, pincode: workerPcode, text: workerProfile.location });
                                  if (!originCoords) {
                                    alert("Could not resolve your pincode to coordinates.");
                                    return;
                                  }

                                  setRouteOrigin(originCoords);
                                  setRouteTarget(destCoords);
                                  // force RouteMap remount so previous maps don't linger
                                  setRouteKey(Date.now());
                                  setRouteOriginInfo({
                                    area: workerProfile.area || "",
                                    colony: workerProfile.colony || "",
                                    state: workerProfile.state || "",
                                    pincode: workerPcode,
                                  });
                                  setRouteDestInfo({
                                    area: app.ownerArea || app.area || "",
                                    colony: app.ownerColony || app.colony || "",
                                    state: app.ownerState || app.state || "",
                                    pincode: pcode,
                                  });
                                  setShowRoute(true);
                                } finally {
                                  setRouteLoading(false);
                                }
                              }}
                          >
                            🗺️ Route to Owner
                          </button>
                        </div>
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
            <label>Area / Locality</label>
            <input
              type="text"
              name="area"
              value={workerProfile.area}
              onChange={handleProfileChange}
            />
            <label>Colony / Society</label>
            <input
              type="text"
              name="colony"
              value={workerProfile.colony}
              onChange={handleProfileChange}
            />
            <label>State</label>
            <input
              type="text"
              name="state"
              value={workerProfile.state}
              onChange={handleProfileChange}
            />
            <label>Contact</label>
            <input
              type="text"
              name="contact"
              value={workerProfile.contact}
              onChange={handleProfileChange}
            />
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={workerProfile.age}
              onChange={handleProfileChange}
            />
            <label>Experience (years)</label>
            <input
              type="number"
              name="experienceYears"
              value={workerProfile.experienceYears}
              onChange={handleProfileChange}
            />
            <label>Pincode</label>
            <input
              type="text"
              name="pincode"
              value={workerProfile.pincode}
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
          ownerId={chatApplication.ownerId}
          onClose={() => setChatApplication(null)}
        />
      )}

      {/* Route overlay/sidebar */}
      {showRoute && routeTarget && (
        <div className="route-overlay">
          <div className="route-content">
            <RouteMap
              key={routeKey || `${(routeOrigin||[17.385,78.4867]).join(',')}_${(routeTarget||[0,0]).join(',')}`}
              origin={routeOrigin || [17.385, 78.4867]}
              destination={routeTarget}
              originInfo={routeOriginInfo}
              destinationInfo={routeDestInfo}
              onClose={() => setShowRoute(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;


