import React, { useState } from "react";
import "./Dashboard.css";
import JobManager from "./JobManager";
import Analytics from "./Analytics";
import RatingSection from "./RatingSection";
import WorkerSearch from "./WorkerSearch";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("jobs");

  const renderSection = () => {
    switch (activeTab) {
      case "jobs":
        return <JobManager />;
      case "analytics":
        return <Analytics />;
      case "ratings":
        return <RatingSection />;
      case "workers":
        return <WorkerSearch />;
      default:
        return <JobManager />;
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>ShramSaathi</h2>
        <ul>
          <li
            className={activeTab === "jobs" ? "active" : ""}
            onClick={() => setActiveTab("jobs")}
          >
            🧰 Job Manager
          </li>
          <li
            className={activeTab === "analytics" ? "active" : ""}
            onClick={() => setActiveTab("analytics")}
          >
            📊 Analytics
          </li>
          <li
            className={activeTab === "ratings" ? "active" : ""}
            onClick={() => setActiveTab("ratings")}
          >
            ⭐ Ratings
          </li>
          <li
            className={activeTab === "workers" ? "active" : ""}
            onClick={() => setActiveTab("workers")}
          >
            🔍 Workers
          </li>
        </ul>
      </aside>

      {/* Main Section */}
      <main className="dashboard-main">
        <header>
          <h1>
            {activeTab === "jobs"
              ? "Job Management"
              : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          <p>Manage everything from one clean, beautiful panel.</p>
        </header>
        <section className="dashboard-content">{renderSection()}</section>
      </main>
    </div>
  );
};

export default Dashboard;
