import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./OwnerLayout.css";

const OwnerLayout = () => {
  const location = useLocation();

  const menuItems = [
    { name: "Job Manager", path: "/owner/jobs", icon: "💼" },
    { name: "Analytics", path: "/owner/analytics", icon: "📊" },
    { name: "Applications", path: "/owner/applications", icon: "📩" },
  ];

  return (
    <div className="owner-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">ShramSaathi</h2>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
            >
              <span className="icon">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default OwnerLayout;
