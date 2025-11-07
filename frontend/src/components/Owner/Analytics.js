import React, { useEffect, useState } from "react";
import { jobService } from "../../services/jobService";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from "recharts";
import "./Analytics.css";

const COLORS = ["#2563EB", "#16A34A", "#FACC15", "#DC2626", "#7C3AED"];

const Analytics = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getAllJobs();
        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };
    fetchJobs();
  }, []);

  // ✅ Handle empty data safely
  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <div className="analytics-container">
        <h2>📊 ShramSaathi Analytics Dashboard</h2>
        <p>No jobs data available yet.</p>
      </div>
    );
  }

  // ✅ Basic metrics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status?.toLowerCase() === "active").length;
  const completedJobs = jobs.filter((j) => j.status?.toLowerCase() === "completed").length;

  // ✅ Pie Chart: Jobs by Skill
  const jobsBySkill = Object.values(
    jobs.reduce((acc, job) => {
      const skill = job.skillNeeded || "Other";
      if (!acc[skill]) acc[skill] = { name: skill, value: 0 };
      acc[skill].value += 1;
      return acc;
    }, {})
  );

  // ✅ Bar Chart: Pay by Skill
  const payData = Object.values(
    jobs.reduce((acc, job) => {
      const skill = job.skillNeeded || "Other";
      let payValue = 0;

      // Safe parse — works for both string or number
      if (typeof job.pay === "string") {
        payValue = parseFloat(job.pay.replace(/[^\d.]/g, "")) || 0;
      } else if (typeof job.pay === "number") {
        payValue = job.pay;
      }

      if (!acc[skill]) acc[skill] = { name: skill, totalPay: 0 };
      acc[skill].totalPay += payValue;
      return acc;
    }, {})
  );

  return (
    <div className="analytics-container">
      <h2>📊 ShramSaathi Analytics Dashboard</h2>
      <p className="subtitle">Track job trends, wages, and skill demand</p>

      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card blue">
          <h3>{totalJobs}</h3>
          <p>Total Jobs</p>
        </div>
        <div className="card green">
          <h3>{activeJobs}</h3>
          <p>Active Jobs</p>
        </div>
        <div className="card yellow">
          <h3>{completedJobs}</h3>
          <p>Completed Jobs</p>
        </div>
      </div>

      {/* Charts */}
      <div className="charts">
        <div className="chart-box">
          <h4>Jobs by Skill</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                data={jobsBySkill}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {jobsBySkill.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-box">
          <h4>Total Pay by Skill</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={payData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalPay" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
