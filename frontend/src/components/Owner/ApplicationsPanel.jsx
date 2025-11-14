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
  const [showDebug, setShowDebug] = useState(false); // debug: show per-application filter evaluation
  const [openProfileIds, setOpenProfileIds] = useState({}); // tracks which rows show raw profile JSON
  const [openChatFor, setOpenChatFor] = useState(null);
  // Applied filters: only updated when user clicks Search
  const [appliedMinAge, setAppliedMinAge] = useState(null);
  const [appliedMaxAge, setAppliedMaxAge] = useState(null);
  const [appliedMinExperience, setAppliedMinExperience] = useState(null);
  const [appliedMaxExperience, setAppliedMaxExperience] = useState(null);
  const [appliedFilterPincode, setAppliedFilterPincode] = useState("");
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
  // const fetchApplications = async () => {
  //   if (!selectedJobId) return;

  //   setLoading(true);
  //   try {
  //     const res = await axios.get(`${API_BASE}/applications/job/${selectedJobId}`);
  //     const apps = res.data || [];

  //     // Collect unique workerIds and fetch their profiles in parallel
  //     const workerIds = [...new Set(apps.map((a) => a.workerId).filter(Boolean))];
  //     const workersById = {};

  //     if (workerIds.length > 0) {
  //       const workerResponses = await Promise.all(
  //         workerIds.map(async (id) => {
  //           try {
  //             const response = await axios.get(`${API_BASE}/users/${id}`);
  //             console.log(`Fetched worker ${id}:`, response.data); // Debug log
  //             return { id, data: response.data };
  //           } catch (e) {
  //             console.error(`Failed to load user ${id}:`, e);
  //             return { id, data: null };
  //           }
  //         })
  //       );

  //       workerResponses.forEach((wr) => {
  //         if (wr && wr.id != null && wr.data) {
  //           workersById[wr.id] = wr.data;
  //           console.log(`Stored worker ${wr.id} in workersById:`, wr.data); // Debug log
  //         }
  //       });
  //     }

  //     // Attach workerProfile to each application object
  //     const enriched = apps.map((app) => {
  //       const profile = workersById[app.workerId];
  //       console.log(`Enriching application for worker ${app.workerId}:`, profile); // Debug log
  //       return { ...app, workerProfile: profile || null };
  //     });

  //     setApplications(enriched);
  //   } catch (err) {
  //     console.error("Error fetching applications:", err);
  //     setMessage("Failed to load applications. Please try again.");
  //     setTimeout(() => setMessage(""), 3000);
  //   }
  //   setLoading(false);
  // };

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
            return { id: String(id), data: response.data }; // ✅ ensure string key
          } catch (e) {
            console.error(`Failed to load user ${id}:`, e);
            return { id: String(id), data: null };
          }
        })
      );

      workerResponses.forEach((wr) => {
        if (wr && wr.id && wr.data) {
          workersById[wr.id] = wr.data;
          console.log(`Stored worker ${wr.id} in workersById:`, wr.data); // Debug log
        }
      });
    }

    // ✅ Attach workerProfile safely using consistent string keys
    const enriched = apps.map((app) => {
      const workerKey = String(app.workerId);
      const profile = workersById[workerKey] || null;
      console.log(`Enriching application for worker ${workerKey}:`, profile);
      return { ...app, workerProfile: profile };
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

  // Helpers to read possible field names from workerProfile
  const resolveAge = (profile) => {
    if (!profile) return null;
    // common numeric age fields
    const candidates = [profile.age, profile.ageYears, profile.years, profile.yearsOfAge, profile.yearsOld];
    for (const c of candidates) {
      const n = Number(c);
      if (!isNaN(n) && n !== 0) return n;
    }
    // experience sometimes stored in years field
    const alt = Number(profile.experienceYears ?? profile.experience ?? profile.exp ?? profile.expYears);
    if (!isNaN(alt) && alt !== 0) return null; // don't treat experience as age
    // dob -> calculate age
    const dob = profile.dob || profile.dateOfBirth || profile.birthDate;
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d)) {
        const diff = Date.now() - d.getTime();
        const age = Math.floor(new Date(diff).getUTCFullYear() - 1970);
        if (!isNaN(age)) return age;
      }
    }
    return null;
  };

  const resolveExperience = (profile) => {
    if (!profile) return null;
    const candidates = [profile.experienceYears, profile.experience, profile.exp, profile.expYears, profile.yearsOfExperience, profile.yearsExperience];
    for (const c of candidates) {
      const n = Number(c);
      if (!isNaN(n)) return n;
    }
    return null;
  };

  const resolvePincode = (profile) => {
    if (!profile) return "";
    const candidates = [profile.pincode, profile.pin, profile.postalCode, profile.postal_code, profile.zip, profile.zipcode, profile.postcode];
    for (const c of candidates) {
      if (c != null && String(c).trim() !== "") return String(c).trim();
    }
    return "";
  };

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
        <label style={{ fontSize: 13, color: '#374151' }}>
          <input type="checkbox" checked={showDebug} onChange={(e) => setShowDebug(e.target.checked)} style={{ marginRight: 6 }} />
          Show debug
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
          placeholder="Pincode (exact match)"
          value={filterPincode}
          onChange={(e) => setFilterPincode(e.target.value)}
          style={{ width: 150, marginLeft: 8 }}
        />

        <button className="search-btn" onClick={() => {
          // parse numeric values and apply
          const parseNum = (v) => {
            const n = Number(v);
            return isNaN(n) ? null : n;
          };
          setAppliedMinAge(parseNum(minAge));
          setAppliedMaxAge(parseNum(maxAge));
          setAppliedMinExperience(parseNum(minExperience));
          setAppliedMaxExperience(parseNum(maxExperience));
          setAppliedFilterPincode(filterPincode && filterPincode.trim() !== "" ? String(filterPincode).trim() : "");
        }}>
          Search
        </button>
        <button className="clear-btn" onClick={() => {
          // clear input fields and applied filters
          setMinAge(""); setMaxAge(""); setMinExperience(""); setMaxExperience(""); setFilterPincode("");
          setAppliedMinAge(null); setAppliedMaxAge(null); setAppliedMinExperience(null); setAppliedMaxExperience(null); setAppliedFilterPincode("");
        }} style={{ marginLeft: 8 }}>
          Clear
        </button>
      </div>

      {/* ✅ Table */}
      {(() => {
        // compute filtered applications here (keeps JSX tidy)
        // const filteredApplications = applications.filter((app) => {
        //   const p = app.workerProfile;

        //   // Use applied filters (only updated when Search clicked). If none applied, show all.
        //   const minAgeNum = appliedMinAge;
        //   const maxAgeNum = appliedMaxAge;
        //   const minExpNum = appliedMinExperience;
        //   const maxExpNum = appliedMaxExperience;
        //   const pinApplied = appliedFilterPincode && appliedFilterPincode.trim() !== "" ? String(appliedFilterPincode).trim() : null;

        //   const anyFilterActive = (minAgeNum !== null) || (maxAgeNum !== null) || (minExpNum !== null) || (maxExpNum !== null) || (pinApplied !== null);
        //   if (!p && anyFilterActive) return false;

        //   if (p) {
        //     const ageNum = resolveAge(p);
        //     const expNum = resolveExperience(p);

        //     if (minAgeNum !== null && (ageNum == null || isNaN(ageNum) || ageNum < minAgeNum)) return false;
        //     if (maxAgeNum !== null && (ageNum == null || isNaN(ageNum) || ageNum > maxAgeNum)) return false;

        //     if (minExpNum !== null && (expNum == null || isNaN(expNum) || expNum < minExpNum)) return false;
        //     if (maxExpNum !== null && (expNum == null || isNaN(expNum) || expNum > maxExpNum)) return false;

        //     const pincodeStr = resolvePincode(p);
        //     // Now pincode is exact match if applied
        //     if (pinApplied !== null && pincodeStr !== pinApplied) return false;
        //   }

        //   return true;
        // });

        // ✅ Corrected filtering logic (only this part needs to change)
  const filteredApplications = applications.filter((app) => {
  const worker = app.workerProfile || app.worker;

  // Skip if profile not yet loaded
  if (!worker || Object.keys(worker).length === 0) return false;

  const age = Number(worker.age) || 0;
  const exp = Number(worker.experience) || 0;
  const pin = String(worker.pincode || "");

  const minA = minAge !== "" ? Number(minAge) : null;
  const maxA = maxAge !== "" ? Number(maxAge) : null;
  const minE = minExperience !== "" ? Number(minExperience) : null;
  const maxE = maxExperience !== "" ? Number(maxExperience) : null;
  const fPin = filterPincode ? String(filterPincode) : "";

  const ageOk = (!minA || age >= minA) && (!maxA || age <= maxA);
  const expOk = (!minE || exp >= minE) && (!maxE || exp <= maxE);
  const pinOk = !fPin || pin === fPin;
    console.log(worker.name, worker.age, worker.experience, worker.pincode);
  return ageOk && expOk && pinOk;
});

  // If debug 'showAll' is checked, bypass filters and show every application
  const finalApplications = showAll ? applications : filteredApplications;
  const resultsCount = finalApplications.length;

  if (loading) return <p>Loading applications...</p>;
  if (resultsCount === 0) return <p className="empty-msg">No applications match the current filters.</p>;

        // Debug panel: show per-application values and whether they passed filters
        const debugPanel = showDebug ? (
          <div style={{ margin: '10px 0', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e6eefc' }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>Filter debug</strong>
            {applications.map((app) => {
              const p = app.workerProfile || {};
                const ageNum = resolveAge(p);
                const expNum = resolveExperience(p);
                const pincodeStr = resolvePincode(p);
              // Use applied filters for debug
              const minAgeNum = appliedMinAge;
              const maxAgeNum = appliedMaxAge;
              const minExpNum = appliedMinExperience;
              const maxExpNum = appliedMaxExperience;
              const pinApplied = appliedFilterPincode && appliedFilterPincode.trim() !== "" ? String(appliedFilterPincode).trim() : null;
              let passes = true;
              const anyFilterActive = (minAgeNum !== null) || (maxAgeNum !== null) || (minExpNum !== null) || (maxExpNum !== null) || (pinApplied !== null);
              if (!app.workerProfile && anyFilterActive) passes = false;
              if (app.workerProfile) {
                if (minAgeNum !== null && (ageNum == null || isNaN(ageNum) || ageNum < minAgeNum)) passes = false;
                if (maxAgeNum !== null && (ageNum == null || isNaN(ageNum) || ageNum > maxAgeNum)) passes = false;
                if (minExpNum !== null && (expNum == null || isNaN(expNum) || expNum < minExpNum)) passes = false;
                if (maxExpNum !== null && (expNum == null || isNaN(expNum) || expNum > maxExpNum)) passes = false;
                if (pinApplied !== null && pincodeStr !== pinApplied) passes = false;
              }

              return (
                <div key={app.id} style={{ padding: 8, borderBottom: '1px dashed #e6eefc' }}>
                  <div style={{ fontWeight: 700 }}>{app.workerProfile?.name || app.workerName || `Worker ${app.workerId || 'N/A'}`}</div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    id: {app.workerId ?? 'N/A'} • resolved age: {ageNum ?? 'N/A'} • resolved exp: {expNum ?? 'N/A'} • resolved pincode: {pincodeStr || 'N/A'}
                  </div>
                  <div style={{ marginTop: 6 }}><strong style={{ color: passes ? '#0b6623' : '#b91c1c' }}>{passes ? 'PASS' : 'FILTERED OUT'}</strong></div>
                </div>
              )
            })}
          </div>
        ) : null;

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
                              <div style={{ marginTop: 8 }}>
                                <button
                                  className="clear-btn"
                                  onClick={() => setOpenProfileIds(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                                >
                                  {openProfileIds[app.id] ? 'Hide profile' : 'View profile'}
                                </button>
                              </div>
                        </div>
                      ) : (
                        <div className="worker-details">No profile available</div>
                      )}
                          {openProfileIds[app.id] && app.workerProfile && (
                            <pre style={{ background: '#f3f4f6', padding: 10, borderRadius: 8, marginTop: 8, overflowX: 'auto' }}>
                              {JSON.stringify(app.workerProfile, null, 2)}
                            </pre>
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




