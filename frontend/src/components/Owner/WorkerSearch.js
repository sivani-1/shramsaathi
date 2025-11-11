import axios from "axios";
import { useEffect, useState } from "react";
import "./WorkerSearch.css";

const API_BASE = "http://localhost:8083/api";

const WorkerSearch = () => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/users`);
        setWorkers(res.data || []);
      } catch (err) {
        console.error("Failed to load workers:", err);
        setError("Failed to load workers. Try again later.");
      }
      setLoading(false);
    };
    fetchWorkers();
  }, []);

  return (
    <div className="worker-directory">
      <h2 className="wd-title">🔍 Registered Workers</h2>
      {error && <div className="wd-error">{error}</div>}
      {loading ? (
        <p>Loading workers…</p>
      ) : workers.length === 0 ? (
        <p className="empty-msg">No workers registered yet.</p>
      ) : (
        <div className="worker-grid">
          {workers.map((w) => (
            <div key={w.id} className="worker-card">
              <div className="worker-card-header">
                <div className="worker-name">{w.name || "Unnamed"}</div>
                <div className="worker-skill">{w.workType || w.workType || w.workType || w.skill || "N/A"}</div>
              </div>
              <div className="worker-card-body">
                {w.phone && <div>📞 {w.phone}</div>}
                {w.address && <div>🏠 {w.address}</div>}
                {(w.area || w.colony || w.pincode) && (
                  <div>📍 {`${w.area || ""}${w.colony ? ", " + w.colony : ""}${w.pincode ? ", " + w.pincode : ""}`}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkerSearch;
