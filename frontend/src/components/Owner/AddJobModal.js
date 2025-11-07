import React, { useState } from "react";
import { jobService } from "../../services/jobService";
import "./JobManager.css";
import "./AddJobModal.css";


const AddJobModal = ({ closeModal, onJobAdded }) => {
  const [form, setForm] = useState({
    title: "",
    skillNeeded: "",
    location: "",
    pay: "",
    duration: "",
    ownerId: 1,
    status: "active",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await jobService.addJob(form);
      onJobAdded();
      closeModal();
    } catch (err) {
      console.error("❌ Error creating job:", err);
      alert("Failed to create job. Check backend.");
    }
  };

  return (
    <div className="modal">
      <h3 className="modal-title">Add New Job</h3>
      <form onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Job Title"
          value={form.title}
          onChange={handleChange}
          required
        />
        <input
          name="skillNeeded"
          placeholder="Skill Needed"
          value={form.skillNeeded}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />
        <input
          name="pay"
          placeholder="Pay (e.g., ₹800/day)"
          value={form.pay}
          onChange={handleChange}
          required
        />
        <input
          name="duration"
          placeholder="Duration (e.g., 5 days)"
          value={form.duration}
          onChange={handleChange}
          required
        />

        <div className="modal-buttons">
          <button type="submit" className="save-btn">
            Save
          </button>
          <button type="button" className="cancel-btn" onClick={closeModal}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddJobModal;
