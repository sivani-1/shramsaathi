import axios from "axios";
import { useEffect, useState } from "react";
import { connect as wsConnect, disconnect as wsDisconnect, send as wsSend, subscribe as wsSubscribe } from "../../services/socketService";
import ChatModal from "./ChatModal";
import RouteMap from "./RouteMap";
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
    // worker pincode (used to geocode worker origin). Replace with real data for logged-in user.
    area: "",
    colony: "",
    state: "",
    pincode: "500081",
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

  // ✅ Fetch all jobs
  useEffect(() => {
    axios.get(`${API_BASE}/jobs`).then((res) => setJobs(res.data));
    // connect websocket once
    try { wsConnect(); } catch (e) {}
  }, []);

  // ✅ Fetch worker applications
  const fetchApplications = async () => {
    try {
      // Get applications
      const res = await axios.get(`${API_BASE}/applications/worker/${workerId}`);
      
      // Get all relevant jobs to get owner information
      const jobsResponse = await axios.get(`${API_BASE}/jobs`);
      const jobsById = {};
      jobsResponse.data.forEach(job => {
        jobsById[job.id] = job;
      });

      // Combine application data with job data
      const enrichedApplications = res.data.map(app => ({
        ...app,
        ownerId: jobsById[app.jobId]?.ownerId || null,
        jobTitle: jobsById[app.jobId]?.title || `Job #${app.jobId}`
      }));

      setApplications(enrichedApplications);

      // Mark already applied job IDs
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
      };

      const res = await axios.post(`${API_BASE}/users`, payload);
      if (res && res.data) {
        setMessage("✅ Profile saved to server.");
      } else {
        setMessage("✅ Profile updated locally.");
      }
    } catch (err) {
      console.error('Profile save failed', err);
      // show friendly fallback message
      setMessage("⚠️ Could not save profile to server. Saved locally.");
    }

    setTimeout(() => setMessage(""), 3000);
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
                      {app.status.toLowerCase() === "accepted" && (
                        <>
                          <button
                            className="apply-btn"
                            onClick={() => {
                              if (!app.ownerId) {
                                setMessage("⚠️ Unable to start chat - This job's owner information is not available");
                                setTimeout(() => setMessage(""), 3000);
                                return;
                              }
                              setChatApplication(app);
                            }}
                          >
                            💬 Chat
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
                        </>
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


