import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// 🧱 Admin Components
import Navbar from "./components/Admin/Navbar";
import Home from "./components/Admin/Home";
import Stats from "./components/Admin/Stats";
import Opening from "./components/Admin/Opening";
import Testimonials from "./components/Admin/Testimonials";
import FAQ from "./components/Admin/Faq";
import Footer from "./components/Admin/Footer";

// 👷 Worker + Owner Components
import WorkerDashboard from "./components/Worker/WorkerDashboard";
import OwnerLayout from "./components/Owner/OwnerLayout";
import JobManager from "./components/Owner/JobManager";
import Analytics from "./components/Owner/Analytics";
import ApplicationsPanel from "./components/Owner/ApplicationsPanel";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🌐 Landing Page */}
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gray-50 text-gray-800">
              <Navbar />
              <Home />
              <Stats />
              <Opening />
              <Testimonials />
              <FAQ />
              <Footer />
            </div>
          }
        />

        {/* 👷 Worker Dashboard */}
        <Route path="/workerDashboard" element={<WorkerDashboard />} />

        {/* 🧑‍💼 Owner Section with Sidebar */}
        <Route element={<OwnerLayout />}>
          {/* Redirect ownerDashboard -> jobs */}
          <Route path="/ownerDashboard" element={<Navigate to="/owner/jobs" />} />
          <Route path="/owner/jobs" element={<JobManager />} />
          <Route path="/owner/analytics" element={<Analytics />} />
          <Route path="/owner/applications" element={<ApplicationsPanel />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
