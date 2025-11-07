import React, { useEffect, useState } from "react";
import { jobService } from "../../services/jobService";
import OwnerHeader from "./OwnerHeader";
import AddJobModal from "./AddJobModal";
import "./JobManager.css";

const JobManager = () => {
  const [jobs, setJobs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const fetchJobs = async () => {
    const data = await jobService.getAllJobs();
    setJobs(data);
  };

  useEffect(() => {
    fetchJobs();
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
        <h2 className="title">Job Manager</h2>
        <button className="add-job-btn" onClick={() => setShowModal(true)}>
          + Add New Job
        </button>
      </div>

      {/* Job Table */}
      <div className="table-container">
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
