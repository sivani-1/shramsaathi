import { useState } from "react";
import { jobService } from "../../services/jobService";
import "./AddJobModal.css";
import "./JobManager.css";


const AddJobModal = ({ closeModal, onJobAdded }) => {
  const [form, setForm] = useState({
    title: "",
    skillNeeded: "",
    location: "",
    pay: "",
    duration: "",
    ownerId: 1,
    status: "active",
    area: "",
    colony: "",
    state: "",
    pincode: "",
   });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  // Normalize numeric fields: pincode -> int
      const payload = { ...form };
      if (payload.pincode === "") delete payload.pincode; else payload.pincode = parseInt(payload.pincode);

      await jobService.addJob(payload);
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
          name="area"
          placeholder="Area / Locality (e.g. Banjara Hills)"
          value={form.area}
          onChange={handleChange}
        />
        <input
          name="colony"
          placeholder="Colony / Society (optional)"
          value={form.colony}
          onChange={handleChange}
        />
        <input
          name="state"
          placeholder="State (e.g. Telangana)"
          value={form.state}
          onChange={handleChange}
        />
        <input
          name="pincode"
          placeholder="Pincode / Postal Code (e.g. 500081)"
          value={form.pincode}
          onChange={handleChange}
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
