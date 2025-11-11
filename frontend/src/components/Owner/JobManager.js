import { useEffect, useState } from "react";
import { jobService } from "../../services/jobService";
import { workerService } from "../../services/workerService";
import AddJobModal from "./AddJobModal";
import "./JobManager.css";
import OwnerHeader from "./OwnerHeader";

const JobManager = () => {
  const [jobs, setJobs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedView, setSelectedView] = useState('jobs');

  const fetchJobs = async () => {
    const data = await jobService.getAllJobs();
    setJobs(data);
  };

  const fetchWorkers = async () => {
    const data = await workerService.getAllWorkers();
    setWorkers(data);
  };

  useEffect(() => {
    fetchJobs();
    fetchWorkers();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      await jobService.deleteJob(id);
      fetchJobs();
    }
  };

  return (
    <div className="job-manager-container">
      {/* Header */}
      <OwnerHeader
        title="Owner Dashboard"
        subtitle="Manage job postings and track worker applications"
      />

      <div className="header-row">
        <div className="view-selector">
          <button 
            className={`view-button ${selectedView === 'jobs' ? 'active' : ''}`}
            onClick={() => setSelectedView('jobs')}
          >
            🏢 Jobs
          </button>
          <button 
            className={`view-button ${selectedView === 'workers' ? 'active' : ''}`}
            onClick={() => setSelectedView('workers')}
          >
            👷 All Workers
          </button>
        </div>
        {selectedView === 'jobs' && (
          <button className="add-job-btn" onClick={() => setShowModal(true)}>
            + Add New Job
          </button>
        )}
      </div>

      {/* Job/Worker Tables */}
      <div className="table-container">
        {selectedView === 'jobs' ? (
          <table className="job-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Skill Needed</th>
                <th>Location</th>
                <th>Pay</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-jobs">
                    No jobs posted yet.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.skillNeeded}</td>
                    <td>{job.location}</td>
                    <td>{job.pay}</td>
                    <td>{job.duration}</td>
                    <td>
                      <span
                        className={
                          job.status === "active"
                            ? "status-active"
                            : "status-closed"
                        }
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(job.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="worker-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Skill</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Area/Colony</th>
                <th>Pincode</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-workers">
                    No workers registered yet.
                  </td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.id}>
                    <td>{worker.name || "Unnamed"}</td>
                    <td>{worker.workType || worker.skill || "N/A"}</td>
                    <td>{worker.phone || "No contact"}</td>
                    <td>{worker.address || "N/A"}</td>
                    <td>
                      {(worker.area || worker.colony) ? 
                        `${worker.area || ''}${worker.colony ? `, ${worker.colony}` : ''}` : 
                        'N/A'
                      }
                    </td>
                    <td>{worker.pincode || "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <AddJobModal
            closeModal={() => setShowModal(false)}
            onJobAdded={fetchJobs}
          />
        </div>
      )}
    </div>
  );
};

export default JobManager;
