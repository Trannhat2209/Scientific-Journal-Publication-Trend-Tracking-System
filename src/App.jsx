import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Chart from "chart.js/auto";

const getAcademicRole = () =>
  window.location.pathname.startsWith("/lecturer-") ? "lecturer" : "researcher";

const getAcademicPath = (path, role = getAcademicRole()) => {
  if (role === "lecturer" && path.startsWith("/researcher-")) {
    return path.replace("/researcher-", "/lecturer-");
  }

  return path;
};

const navTo = (path) => (event) => {
  event.preventDefault();
  window.history.pushState({}, "", getAcademicPath(path));
  window.dispatchEvent(new Event("scholartrend:navigate"));
};

function Brand({ boxed = false, small = false }) {
  return (
    <a
      className={small ? "footer-brand" : "brand"}
      href="/"
      onClick={navTo("/")}
    >
      <span
        className={`brand-mark ${boxed ? "boxed" : ""} ${small ? "small" : ""}`}
        aria-hidden="true"
      >
        {boxed ? (
          <svg viewBox="0 0 24 24" role="img">
            <path d="M5 19V9" />
            <path d="M12 19V5" />
            <path d="M19 19v-7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" role="img">
            <path d="M12 3.25 8.5 8.7l3.5 2.15 3.5-2.15L12 3.25Z" />
            <path d="M7.2 10.05 4.5 14.2l7.5 4.55 7.5-4.55-2.7-4.15-4.8 2.95-4.8-2.95Z" />
            <path d="M6 19.2h12" />
          </svg>
        )}
      </span>
      <span>
        Scholar<span className="brand-gradient-text">Trend</span>
        {small ? " © 2024" : ""}
      </span>
    </a>
  );
}

function LandingPage() {
  const [activeDataPoint, setActiveDataPoint] = React.useState(5); // Default to 2025 (index 5)

  const chartData = [
    { year: "2020", value: 5200, publications: "5,200", growth: "baseline" },
    { year: "2021", value: 12500, publications: "12,500", growth: "+140%" },
    { year: "2022", value: 23800, publications: "23,800", growth: "+90%" },
    { year: "2023", value: 42100, publications: "42,100", growth: "+77%" },
    { year: "2024", value: 60420, publications: "60,420", growth: "+43%" },
    { year: "2025", value: 96847, publications: "96,847", growth: "+160%" },
  ];

  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Primary navigation">
        <Brand />
        <nav className="lp-nav-links" aria-label="Main navigation">
          <a href="/" onClick={navTo("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="5" rx="1.5" />
              <rect x="14" y="12" width="7" height="9" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
            Features
          </a>
          <a href="/" onClick={navTo("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3v18h18" />
              <path d="M18 17l-5-5-4 4-6-6" />
            </svg>
            Trends
          </a>
          <a href="/" onClick={navTo("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
              <path d="M12 12v4" />
              <path d="M10 14h4" />
            </svg>
            Pricing
          </a>
          <a href="/" onClick={navTo("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Resources
          </a>
          <a href="/" onClick={navTo("/")}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            About
          </a>
        </nav>
        <nav className="nav-actions" aria-label="Account">
          <a className="login-link" href="/login" onClick={navTo("/login")}>
            <svg viewBox="0 0 24 24" className="login-icon" aria-hidden="true">
              <path d="M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
              <path d="M19 12H9" />
              <path d="m15 8 4 4-4 4" />
            </svg>
            <span>Log in</span>
          </a>
          <a
            className="primary-button compact"
            href="/register"
            onClick={navTo("/register")}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: "18px", height: "18px", strokeWidth: 2 }}
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            Get Started
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lp-hero-section">
        <div className="lp-hero-copy">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-star">★</span>
            AI-Powered Research Intelligence
          </div>
          <h1 className="lp-hero-h1">
            Track the Pulse of <br />
            <span className="lp-brand-blue">Research</span>
          </h1>
          <p className="lp-hero-desc">
            ScholarTrend aggregates, analyzes, and visualizes academic
            publications from trusted scholarly databases to reveal emerging
            research trends with clarity.
          </p>
          <div className="lp-search-bar">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="lp-search-icon"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
            <input
              type="text"
              placeholder="Search publications, authors, topics, or journals..."
              className="lp-search-input"
            />
            <button className="lp-search-btn">
              Search
              <svg
                viewBox="0 0 24 24"
                className="lp-search-btn-icon"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m16.5 16.5 4 4" />
              </svg>
            </button>
          </div>
          <div className="lp-hero-actions">
            <a
              className="lp-primary-btn"
              href="/register"
              onClick={navTo("/register")}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  width: "20px",
                  height: "20px",
                  strokeWidth: 2.5,
                  fill: "none",
                }}
              >
                <path d="M12 2v20M5 12l7-7 7 7" />
              </svg>
              Get Started - It's Free
            </a>
            <a className="lp-demo-btn" href="/login" onClick={navTo("/login")}>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="lp-demo-play-icon"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              View Demo
            </a>
          </div>
          <div className="lp-trust-row">
            <div className="lp-avatar-group" aria-hidden="true">
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 1"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 2"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 3"
              />
              <img
                className="lp-avatar"
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Researcher 4"
              />
            </div>
            <div className="lp-trust-text">
              <span className="lp-stars">★★★★★</span>
              <span>Trusted by 10,000+ researchers worldwide</span>
            </div>
          </div>
        </div>
        <div
          className="lp-hero-visual"
          aria-label="ScholarTrend analytics dashboard"
        >
          <div className="lp-dashboard-mockup">
            <div className="lp-dash-header">
              <span className="lp-dash-logo">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  aria-hidden="true"
                  style={{ stroke: "#06b6d4", fill: "none" }}
                >
                  <path d="M12 3.25 8.5 8.7l3.5 2.15 3.5-2.15L12 3.25Z" />
                  <path d="M7.2 10.05 4.5 14.2l7.5 4.55 7.5-4.55-2.7-4.15-4.8 2.95-4.8-2.95Z" />
                </svg>
                ScholarTrend
              </span>
              <div className="lp-dash-search-container">
                <svg
                  viewBox="0 0 24 24"
                  className="lp-dash-search-icon"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16.5 16.5 4 4" />
                </svg>
                <input
                  className="lp-dash-search"
                  placeholder="Search anything..."
                  readOnly
                />
              </div>
              <div className="lp-dash-header-actions">
                <svg
                  viewBox="0 0 24 24"
                  className="lp-dash-bell"
                  aria-hidden="true"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <img
                  className="lp-dash-avatar"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=40&h=40&q=80"
                  alt="Avatar"
                />
              </div>
            </div>
            <div className="lp-dash-body">
              <nav className="lp-dash-sidebar">
                {[
                  {
                    name: "Overview",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1.5" />
                        <rect x="14" y="3" width="7" height="5" rx="1.5" />
                        <rect x="14" y="12" width="7" height="9" rx="1.5" />
                        <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      </svg>
                    ),
                  },
                  {
                    name: "Trends",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M3 17l6-6 4 4 8-8" />
                        <path d="M21 7v6h-6" />
                      </svg>
                    ),
                  },
                  {
                    name: "Publications",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                    ),
                  },
                  {
                    name: "Journals",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                    ),
                  },
                  {
                    name: "Authors",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    ),
                  },
                  {
                    name: "Alerts",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    ),
                  },
                  {
                    name: "Saved",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                  },
                  {
                    name: "Settings",
                    icon: (
                      <svg viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.25m5.07 5.07l4.24 4.25M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.07-5.07l4.24-4.25" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <span
                    key={item.name}
                    className={`lp-dash-navitem${item.name === "Overview" ? " active" : ""}`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </span>
                ))}
              </nav>
              <div className="lp-dash-content">
                <div className="lp-dash-title">Overview</div>
                <div className="lp-dash-stats">
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">2.1M+</span>
                      <span className="lp-dash-stat-label">Publications</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">150K+</span>
                      <span className="lp-dash-stat-label">Journals</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">500K+</span>
                      <span className="lp-dash-stat-label">Researchers</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                  </div>
                  <div className="lp-dash-stat">
                    <div className="lp-dash-stat-left">
                      <span className="lp-dash-stat-val">98+</span>
                      <span className="lp-dash-stat-label">Countries</span>
                    </div>
                    <div className="lp-dash-stat-icon-wrapper">
                      <svg
                        viewBox="0 0 24 24"
                        className="lp-dash-stat-icon"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="lp-dash-charts">
                  <div className="lp-dash-chart-box">
                    <div className="lp-dash-chart-title">Publication Trend</div>
                    <svg
                      viewBox="0 0 180 80"
                      className="lp-mini-chart"
                      aria-hidden="true"
                    >
                      <defs>
                        <linearGradient
                          id="chartFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#3b82f6"
                            stopOpacity="0.25"
                          />
                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <line
                        x1="20"
                        y1="15"
                        x2="170"
                        y2="15"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="35"
                        x2="170"
                        y2="35"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="55"
                        x2="170"
                        y2="55"
                        stroke="#f1f5f9"
                        strokeWidth="1"
                      />
                      <line
                        x1="20"
                        y1="70"
                        x2="170"
                        y2="70"
                        stroke="#cbd5e1"
                        strokeWidth="1"
                      />

                      <path
                        d="M20 65 Q 35 62, 50 56 T 80 46 T 110 30 T 140 18 T 170 8"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2"
                      />
                      <path
                        d="M20 65 Q 35 62, 50 56 T 80 46 T 110 30 T 140 18 T 170 8 L 170 70 L 20 70 Z"
                        fill="url(#chartFill)"
                      />

                      <circle
                        cx="20"
                        cy="65"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="50"
                        cy="56"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="80"
                        cy="46"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="110"
                        cy="30"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="140"
                        cy="18"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="170"
                        cy="8"
                        r="3"
                        fill="#ffffff"
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                      />

                      <text x="5" y="18" fill="#94a3b8" fontSize="6">
                        100K
                      </text>
                      <text x="5" y="38" fill="#94a3b8" fontSize="6">
                        50K
                      </text>
                      <text x="5" y="58" fill="#94a3b8" fontSize="6">
                        25K
                      </text>
                      <text x="5" y="73" fill="#94a3b8" fontSize="6">
                        0
                      </text>

                      <text
                        x="20"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2020
                      </text>
                      <text
                        x="50"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2021
                      </text>
                      <text
                        x="80"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2022
                      </text>
                      <text
                        x="110"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2023
                      </text>
                      <text
                        x="140"
                        y="79"
                        fill="#94a3b8"
                        fontSize="6"
                        textAnchor="middle"
                      >
                        2024
                      </text>
                    </svg>
                  </div>
                  <div className="lp-dash-chart-box donut-box">
                    <div className="lp-dash-chart-title">
                      Top Research Areas
                    </div>
                    <div className="lp-donut-row">
                      <svg
                        viewBox="0 0 60 60"
                        width="48"
                        height="48"
                        aria-hidden="true"
                        style={{
                          transform: "rotate(-90deg)",
                          display: "block",
                        }}
                      >
                        <circle
                          cx="30"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="6"
                          strokeDasharray="44 81.6"
                          strokeDashoffset="0"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="6"
                          strokeDasharray="27.6 98"
                          strokeDashoffset="-44"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="6"
                          strokeDasharray="22.6 103"
                          strokeDashoffset="-71.6"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="#f97316"
                          strokeWidth="6"
                          strokeDasharray="18.8 106.8"
                          strokeDashoffset="-94.2"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="20"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeDasharray="12.6 113"
                          strokeDashoffset="-113"
                        />
                      </svg>
                      <div className="lp-donut-legend">
                        <span>
                          <i style={{ background: "#3b82f6" }}></i>Artificial
                          Intelligence 35%
                        </span>
                        <span>
                          <i style={{ background: "#0ea5e9" }}></i>Medicine 22%
                        </span>
                        <span>
                          <i style={{ background: "#8b5cf6" }}></i>Computer
                          Science 18%
                        </span>
                        <span>
                          <i style={{ background: "#f97316" }}></i>Engineering
                          15%
                        </span>
                        <span>
                          <i style={{ background: "#10b981" }}></i>Others 10%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="lp-dash-bottom-grid">
                  <div className="lp-dash-emerging">
                    <div className="lp-dash-chart-title">Emerging Topics</div>
                    {[
                      {
                        label: "Large Language Models",
                        pct: "+168%",
                        path: "M 2 15 Q 15 12, 25 14 T 45 6 T 58 2",
                      },
                      {
                        label: "AI in Healthcare",
                        pct: "+112%",
                        path: "M 2 14 Q 15 6, 25 11 T 45 4 T 58 2",
                      },
                      {
                        label: "Quantum Computing",
                        pct: "+95%",
                        path: "M 2 16 Q 15 13, 25 9 T 45 6 T 58 3",
                      },
                      {
                        label: "Sustainable Energy",
                        pct: "+74%",
                        path: "M 2 15 Q 15 9, 25 12 T 45 7 T 58 4",
                      },
                    ].map((t) => (
                      <div key={t.label} className="lp-emerging-row">
                        <span className="lp-emerging-label">{t.label}</span>
                        <div className="lp-emerging-sparkline-wrap">
                          <svg
                            viewBox="0 0 60 20"
                            className="lp-sparkline-svg"
                            aria-hidden="true"
                          >
                            <path
                              d={t.path}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="lp-emerging-pct">{t.pct}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lp-dash-journals">
                    <div className="lp-dash-chart-title">Top Journals</div>
                    <table className="lp-dash-table">
                      <thead>
                        <tr>
                          <th>Journal</th>
                          <th>Volume</th>
                          <th style={{ textAlign: "right" }}>Publications</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="lp-dash-table-name">Nature</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "85%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            28,632
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">Science</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "68%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            22,401
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">IEEE/CAA</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "55%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            18,505
                          </td>
                        </tr>
                        <tr>
                          <td className="lp-dash-table-name">The Lancet</td>
                          <td className="lp-dash-table-bar-col">
                            <div className="lp-dash-table-bar-wrap">
                              <div
                                className="lp-dash-table-bar"
                                style={{ width: "36%" }}
                              ></div>
                            </div>
                          </td>
                          <td
                            style={{ textAlign: "right" }}
                            className="lp-dash-table-val"
                          >
                            12,098
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="lp-stats-bar" aria-label="Platform statistics">
        <div className="lp-stat-item">
          <svg viewBox="0 0 24 24" className="lp-stat-icon" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
          <div>
            <strong>2M+</strong>
            <span>Publications Indexed</span>
          </div>
        </div>
        <div className="lp-stat-divider" aria-hidden="true"></div>
        <div className="lp-stat-item">
          <svg viewBox="0 0 24 24" className="lp-stat-icon" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div>
            <strong>500K+</strong>
            <span>Researchers</span>
          </div>
        </div>
        <div className="lp-stat-divider" aria-hidden="true"></div>
        <div className="lp-stat-item">
          <svg viewBox="0 0 24 24" className="lp-stat-icon" aria-hidden="true">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <div>
            <strong>150K+</strong>
            <span>Journals</span>
          </div>
        </div>
        <div className="lp-stat-divider" aria-hidden="true"></div>
        <div className="lp-stat-item">
          <svg viewBox="0 0 24 24" className="lp-stat-icon" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <div>
            <strong>50+</strong>
            <span>Countries</span>
          </div>
        </div>
      </section>

      {/* Powerful Features Section */}
      <section className="lp-features-section" aria-labelledby="features-title">
        <div className="lp-section-label">POWERFUL FEATURES</div>
        <h2 id="features-title" className="lp-section-h2">
          Everything you need for
          <br />
          smarter research
        </h2>
        <p className="lp-section-desc">
          Advanced tools to help you discover, analyze, and stay ahead in the
          ever-evolving world of academic research.
        </p>
        <div className="lp-feature-grid">
          <article className="lp-feat-card">
            <div className="lp-feat-icon blue">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <h3>Smart Search</h3>
            <p>
              Advanced semantic search understands context, not just keywords.
              Find the most relevant publications instantly.
            </p>
            <a
              className="lp-feat-link"
              href="/register"
              onClick={navTo("/register")}
            >
              Learn more →
            </a>
          </article>
          <article className="lp-feat-card">
            <div className="lp-feat-icon purple">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3v18h18" />
                <path d="M18 17l-5-5-4 4-6-6" />
              </svg>
            </div>
            <h3>Trend Analytics</h3>
            <p>
              Visualize research trends over time, identify emerging topics, and
              track citation velocity in real-time.
            </p>
            <a
              className="lp-feat-link"
              href="/register"
              onClick={navTo("/register")}
            >
              Learn more →
            </a>
          </article>
          <article className="lp-feat-card">
            <div className="lp-feat-icon green">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3>AI Insights</h3>
            <p>
              AI-powered summaries, research gap analysis, and key findings
              extraction from complex papers.
            </p>
            <a
              className="lp-feat-link"
              href="/register"
              onClick={navTo("/register")}
            >
              Learn more →
            </a>
          </article>
          <article className="lp-feat-card">
            <div className="lp-feat-icon orange">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                <path d="M12 7v5" />
              </svg>
            </div>
            <h3>Personal Workspace</h3>
            <p>
              Save papers, follow topics, set alerts, and organize your research
              in one personalized workspace.
            </p>
            <a
              className="lp-feat-link"
              href="/register"
              onClick={navTo("/register")}
            >
              Learn more →
            </a>
          </article>
        </div>
      </section>

      {/* Dark Trend Visualization Section */}
      <section className="lp-trend-section" aria-labelledby="trend-title">
        <div className="lp-trend-container">
          <div className="lp-trend-left">
            <div className="lp-trend-label">TREND VISUALIZATION</div>
            <h2 id="trend-title" className="lp-trend-h2">
              Discover Emerging
              <br />
              Trends Before
              <br />
              Everyone Else
            </h2>
            <p className="lp-trend-desc">
              Our real-time analytics engine scans millions of publications to
              identify emerging research areas and predict future trends.
            </p>
            <a
              className="lp-explore-btn"
              href="/register"
              onClick={navTo("/register")}
            >
              Explore Trends →
            </a>
          </div>

          <div className="lp-trend-middle">
            <div className="lp-trend-chart-header">
              <span className="lp-trend-topic">AI in Healthcare</span>
              <span className="lp-trend-badge">Emerging</span>
            </div>

            <svg
              viewBox="0 0 400 180"
              className="lp-trend-chart"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line
                x1="40"
                y1="20"
                x2="370"
                y2="20"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <line
                x1="40"
                y1="50"
                x2="370"
                y2="50"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <line
                x1="40"
                y1="80"
                x2="370"
                y2="80"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <line
                x1="40"
                y1="110"
                x2="370"
                y2="110"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <line
                x1="40"
                y1="140"
                x2="370"
                y2="140"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />

              {/* Path */}
              <path
                d="M40 135 C 75 132, 110 125, 145 118 C 180 110, 215 95, 250 82 C 285 68, 320 48, 370 25"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
              />
              <path
                d="M40 135 C 75 132, 110 125, 145 118 C 180 110, 215 95, 250 82 C 285 68, 320 48, 370 25 L 370 140 L 40 140 Z"
                fill="url(#trendArea)"
              />

              {/* Clickable Dots - Single white ring + cyan center */}
              {[
                { cx: 40, cy: 135, idx: 0 },
                { cx: 105, cy: 125, idx: 1 },
                { cx: 170, cy: 112, idx: 2 },
                { cx: 235, cy: 92, idx: 3 },
                { cx: 300, cy: 68, idx: 4 },
                { cx: 370, cy: 25, idx: 5 },
              ].map((point) => (
                <g
                  key={point.idx}
                  onClick={() => setActiveDataPoint(point.idx)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Transparent click area */}
                  <circle
                    cx={point.cx}
                    cy={point.cy}
                    r="10"
                    fill="transparent"
                  />
                  {/* Single white ring */}
                  <circle
                    cx={point.cx}
                    cy={point.cy}
                    r="2.8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1"
                    style={{ transition: "all 0.2s ease" }}
                  />
                  {/* Small cyan center dot */}
                  <circle
                    cx={point.cx}
                    cy={point.cy}
                    r={activeDataPoint === point.idx ? 1.3 : 1.2}
                    fill="#06b6d4"
                    style={{ transition: "all 0.2s ease" }}
                  />
                </g>
              ))}

              {/* Tooltip vertical dashed line */}
              {activeDataPoint !== null && (
                <line
                  x1={[40, 105, 170, 235, 300, 370][activeDataPoint]}
                  y1="20"
                  x2={[40, 105, 170, 235, 300, 370][activeDataPoint]}
                  y2="140"
                  stroke="rgba(6,182,212,0.3)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              )}

              {/* Y axis text */}
              <text x="32" y="23" fill="#94a3b8" fontSize="8" textAnchor="end">
                100k
              </text>
              <text x="32" y="53" fill="#94a3b8" fontSize="8" textAnchor="end">
                75k
              </text>
              <text x="32" y="83" fill="#94a3b8" fontSize="8" textAnchor="end">
                50k
              </text>
              <text x="32" y="113" fill="#94a3b8" fontSize="8" textAnchor="end">
                25k
              </text>
              <text x="32" y="143" fill="#94a3b8" fontSize="8" textAnchor="end">
                0
              </text>

              {/* X axis text */}
              <text
                x="40"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2020
              </text>
              <text
                x="105"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2021
              </text>
              <text
                x="170"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2022
              </text>
              <text
                x="235"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2023
              </text>
              <text
                x="300"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2024
              </text>
              <text
                x="370"
                y="155"
                fill="#64748b"
                fontSize="8"
                textAnchor="middle"
              >
                2025
              </text>

              {/* Tooltip box - Dynamic based on activeDataPoint */}
              {activeDataPoint !== null && (
                <>
                  <rect
                    x={
                      [40, 105, 170, 235, 300, 370][activeDataPoint] > 250
                        ? [40, 105, 170, 235, 300, 370][activeDataPoint] - 110
                        : [40, 105, 170, 235, 300, 370][activeDataPoint] + 10
                    }
                    y={
                      [135, 125, 112, 92, 68, 25][activeDataPoint] > 80
                        ? [135, 125, 112, 92, 68, 25][activeDataPoint] - 45
                        : [135, 125, 112, 92, 68, 25][activeDataPoint] + 10
                    }
                    width="100"
                    height="32"
                    rx="6"
                    fill="rgba(13, 27, 42, 0.95)"
                    stroke="rgba(6, 182, 212, 0.4)"
                    strokeWidth="1.5"
                  />
                  <text
                    x={
                      ([40, 105, 170, 235, 300, 370][activeDataPoint] > 250
                        ? [40, 105, 170, 235, 300, 370][activeDataPoint] - 110
                        : [40, 105, 170, 235, 300, 370][activeDataPoint] + 10) +
                      6
                    }
                    y={
                      ([135, 125, 112, 92, 68, 25][activeDataPoint] > 80
                        ? [135, 125, 112, 92, 68, 25][activeDataPoint] - 45
                        : [135, 125, 112, 92, 68, 25][activeDataPoint] + 10) +
                      12
                    }
                    fill="#ffffff"
                    fontSize="7"
                    fontWeight="bold"
                  >
                    {chartData[activeDataPoint].year}
                    {activeDataPoint === 5 ? " (Projected)" : ""}
                  </text>
                  <text
                    x={
                      ([40, 105, 170, 235, 300, 370][activeDataPoint] > 250
                        ? [40, 105, 170, 235, 300, 370][activeDataPoint] - 110
                        : [40, 105, 170, 235, 300, 370][activeDataPoint] + 10) +
                      6
                    }
                    y={
                      ([135, 125, 112, 92, 68, 25][activeDataPoint] > 80
                        ? [135, 125, 112, 92, 68, 25][activeDataPoint] - 45
                        : [135, 125, 112, 92, 68, 25][activeDataPoint] + 10) +
                      22
                    }
                    fill="#06b6d4"
                    fontSize="7.5"
                    fontWeight="bold"
                  >
                    {chartData[activeDataPoint].publications} publications
                  </text>
                  <text
                    x={
                      ([40, 105, 170, 235, 300, 370][activeDataPoint] > 250
                        ? [40, 105, 170, 235, 300, 370][activeDataPoint] - 110
                        : [40, 105, 170, 235, 300, 370][activeDataPoint] + 10) +
                      6
                    }
                    y={
                      ([135, 125, 112, 92, 68, 25][activeDataPoint] > 80
                        ? [135, 125, 112, 92, 68, 25][activeDataPoint] - 45
                        : [135, 125, 112, 92, 68, 25][activeDataPoint] + 10) +
                      30
                    }
                    fill="rgba(255,255,255,0.65)"
                    fontSize="6.5"
                  >
                    {chartData[activeDataPoint].growth !== "baseline"
                      ? `${chartData[activeDataPoint].growth} from ${
                          parseInt(chartData[activeDataPoint].year) - 1
                        }`
                      : "Starting year"}
                  </text>
                </>
              )}
            </svg>
          </div>

          <div className="lp-trend-right">
            <div className="lp-top-rising">
              <div className="lp-top-rising-title">Top Rising Topics</div>
              {[
                { label: "Large Language Models", pct: "+149%" },
                { label: "AI in Healthcare", pct: "+112%" },
                { label: "Quantum Computing", pct: "+95%" },
                { label: "Sustainable Energy", pct: "+76%" },
                { label: "Bioinformatics", pct: "+63%" },
              ].map((t, i) => (
                <div key={t.label} className="lp-rising-row">
                  <span className="lp-rising-rank">{i + 1}</span>
                  <span className="lp-rising-label">{t.label}</span>
                  <span className="lp-rising-pct">{t.pct}</span>
                </div>
              ))}
              <a
                className="lp-view-all-btn"
                href="/register"
                onClick={navTo("/register")}
              >
                View All Trends
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-how-section" aria-labelledby="how-title">
        <div className="lp-section-label">HOW IT WORKS</div>
        <h2 id="how-title" className="lp-section-h2">
          From Search to Insight in 4 Simple Steps
        </h2>
        <div className="lp-steps-row">
          {[
            {
              num: "1",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16.5 16.5 4 4" />
                </svg>
              ),
              label: "Search",
              desc: "Search for topics, keywords, authors, or journals.",
            },
            {
              num: "2",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="3 17 7 12 10 14.5 15 8 21 3" />
                  <rect x="2" y="18" width="20" height="3" rx="1" />
                </svg>
              ),
              label: "Analyze",
              desc: "Analyze trends, citations, and research patterns.",
            },
            {
              num: "3",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M9 15l2 2 4-4" />
                </svg>
              ),
              label: "Explore",
              desc: "Explore related papers, authors, and emerging topics.",
            },
            {
              num: "4",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                </svg>
              ),
              label: "Save & Track",
              desc: "Save your research and get alerts on new developments.",
            },
          ].map((step, i) => (
            <React.Fragment key={step.num}>
              <div className="lp-step">
                <div className={`lp-step-num lp-step-num-${i}`}>{step.num}</div>
                <div className="lp-step-icon">{step.icon}</div>
                <div className="lp-step-label">{step.label}</div>
                <div className="lp-step-desc">{step.desc}</div>
              </div>
              {i < 3 && (
                <div className="lp-step-arrow" aria-hidden="true"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section
        className="lp-testimonials-section"
        aria-labelledby="testimonials-title"
      >
        <div className="lp-section-label">TRUSTED BY RESEARCHERS</div>
        <h2 id="testimonials-title" className="lp-section-h2">
          Loved by Researchers Worldwide
        </h2>
        <div className="lp-testimonials-grid">
          {[
            {
              quote:
                "ScholarTrend has transformed how I discover and track research trends. It saves me hours every week.",
              name: "Dr. Sarah Chen",
              org: "University of Stanford",
              img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&h=100&q=80",
            },
            {
              quote:
                "The trend analysis and AI insights are incredibly accurate. Essential tool for any researcher.",
              name: "Prof. Michael Rodriguez",
              org: "MIT",
              img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&h=100&q=80",
            },
            {
              quote:
                "Finding emerging topics has never been easier. ScholarTrend keeps me ahead of the curve.",
              name: "Dr. Emily Johnson",
              org: "Harvard University",
              img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80",
            },
          ].map((t) => (
            <article key={t.name} className="lp-testimonial-card">
              <div className="lp-testimonial-quote">"</div>
              <p className="lp-testimonial-text">{t.quote}</p>
              <div className="lp-testimonial-author">
                <img
                  className="lp-testimonial-avatar"
                  src={t.img}
                  alt={t.name}
                />
                <div>
                  <div className="lp-testimonial-name">{t.name}</div>
                  <div className="lp-testimonial-org">{t.org}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="lp-testimonials-dots" aria-hidden="true">
          <span className="active"></span>
          <span></span>
          <span></span>
        </div>
      </section>

      {/* CTA Section */}
      <section className="lp-cta-section" aria-label="Call to action">
        <div className="lp-cta-rocket-container" aria-hidden="true">
          <div className="lp-cta-rocket-circle">
            <svg
              viewBox="0 0 24 24"
              className="lp-cta-rocket-svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M12 2C7 2 4 7 4 12c0 2 1.5 4 1.5 4s1.5.5 3 0c3-1 4.5-4 4.5-4S12 11 12 9s-2-2-3-1M12 2c5 0 8 5 8 10 0 2-1.5 4-1.5 4s-1.5.5-3 0c-3-1-4.5-4-4.5-4s1-1 1-3 2-2 3-1" />
              <path d="M12 9c3 3 6 3 9 1.5M12 9c-3 3-6 3-9 1.5M19 19c-1.5 1.5-3.5 2.5-3.5 2.5s1-2.25 2.5-3.5" />
            </svg>
          </div>
          {/* Sparks */}
          <div className="lp-cta-spark spark-1"></div>
          <div className="lp-cta-spark spark-2"></div>
          <div className="lp-cta-spark spark-3"></div>
        </div>
        <div className="lp-cta-text">
          <h2 className="lp-cta-h2">
            Ready to Discover the Next Big
            <br />
            Research Trend?
          </h2>
          <p className="lp-cta-desc">
            Join thousands of researchers who are already using ScholarTrend to
            accelerate their research.
          </p>
        </div>
        <div className="lp-cta-actions">
          <a
            className="lp-cta-btn"
            href="/register"
            onClick={navTo("/register")}
          >
            Start Researching Free →
          </a>
          <span className="lp-cta-note">no credit card required</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-col brand-col">
            <Brand small />
            <p className="lp-footer-tagline">
              The most advanced research intelligence platform for modern
              researchers.
            </p>
            <div className="lp-footer-socials">
              <a href="/" className="lp-social-icon" aria-label="X link">
                𝕏
              </a>
              <a href="/" className="lp-social-icon" aria-label="LinkedIn link">
                in
              </a>
              <a href="/" className="lp-social-icon" aria-label="Facebook link">
                f
              </a>
              <a href="/" className="lp-social-icon" aria-label="GitHub link">
                git
              </a>
              <a
                href="/"
                className="lp-social-icon"
                aria-label="Instagram link"
              >
                📷
              </a>
            </div>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Product</div>
            <a href="/">Features</a>
            <a href="/">Trends</a>
            <a href="/">Pricing</a>
            <a href="/">API</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Resources</div>
            <a href="/">Documentation</a>
            <a href="/">Blog</a>
            <a href="/">Guides</a>
            <a href="/">Support</a>
          </div>
          <div className="lp-footer-col">
            <div className="lp-footer-col-title">Company</div>
            <a href="/">About Us</a>
            <a href="/">Careers</a>
            <a href="/">Contact</a>
            <a href="/">Privacy Policy</a>
          </div>
          <div className="lp-footer-col newsletter-col">
            <div className="lp-footer-col-title">Newsletter</div>
            <p className="lp-newsletter-desc">
              Stay updated with the latest research trends and platform updates.
            </p>
            <div className="lp-newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                className="lp-newsletter-input"
              />
              <button className="lp-newsletter-btn" aria-label="Subscribe">
                →
              </button>
            </div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2024 ScholarTrend. All rights reserved.</span>
          <nav className="lp-footer-bottom-links" aria-label="Legal links">
            <a href="/">Terms of Service</a>
            <a href="/">Privacy Policy</a>
            <a href="/">Contact</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function RegisterPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [registerRole, setRegisterRole] = React.useState("");
  const [roleMenuOpen, setRoleMenuOpen] = React.useState(false);
  const registerRoles = ["Researcher", "Lecturer", "Student", "Administrator"];

  return (
    <main className="auth-shell" aria-label="Register account">
      <section className="auth-card">
        <div className="auth-form-panel">
          <Brand />
          <div className="auth-heading">
            <h1>Create an Account</h1>
            <p>Join the academic intelligence network.</p>
          </div>

          <form className="register-form">
            <label className="field">
              <span>Full Name</span>
              <span className="input-with-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 11.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" />
                  <path d="M5 20c.6-3.7 3.1-5.8 7-5.8s6.4 2.1 7 5.8" />
                  <path d="M17.7 5.5h2.8M19.1 4.1v2.8" />
                </svg>
                <input
                  type="text"
                  placeholder="Dr. Jane Doe"
                  autoComplete="name"
                />
              </span>
            </label>
            <label className="field">
              <span>Email Address</span>
              <span className="input-with-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 6.5h16v11H4z" />
                  <path d="m5.2 7.8 6.8 5 6.8-5" />
                  <path d="M16.8 4.1v2.3M15.7 5.2h2.3" />
                </svg>
                <input
                  type="email"
                  placeholder="jane.doe@university.edu"
                  autoComplete="email"
                />
              </span>
            </label>
            <div
              className="field register-role-field"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setRoleMenuOpen(false);
                }
              }}
            >
              <span>Primary Role</span>
              <span className="input-with-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                  <path d="M7 12v3.4c0 1.8 2 3.1 5 3.1s5-1.3 5-3.1V12" />
                  <path d="M20 10.5V16" />
                </svg>
                <button
                  className="register-role-trigger"
                  type="button"
                  aria-expanded={roleMenuOpen}
                  aria-haspopup="listbox"
                  onClick={() => setRoleMenuOpen((open) => !open)}
                >
                  {registerRole || "Select your role"}
                </button>
                {roleMenuOpen && (
                  <div className="register-role-menu" role="listbox">
                    {registerRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        role="option"
                        aria-selected={registerRole === role}
                        onClick={() => {
                          setRegisterRole(role);
                          setRoleMenuOpen(false);
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </span>
            </div>
            <label className="field">
              <span>Password</span>
              <span className="input-with-icon password-input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.7 18.2 7v4.4c0 3.5-2.4 6.2-6.2 7.7-3.8-1.5-6.2-4.2-6.2-7.7V7L12 3.7Z" />
                  <path d="M9.2 11.3V10a2.8 2.8 0 0 1 5.6 0v1.3" />
                  <rect x="8.6" y="11.3" width="6.8" height="5" rx="1.2" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  defaultValue="Scholar2024"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.6 17.6L20 20M9.8 9.8a3 3 0 114.2 4.2M2 12s3-5.5 10-5.5a9.8 9.8 0 014.2.9M6.8 17.2A10.4 10.4 0 012 12M12 17.5c2.8 0 5.4-1.2 7-3.3M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            <div className="password-meter" aria-label="Weak password">
              <strong>Weak password</strong>
              <span className="meter-bars" aria-hidden="true">
                <i className="active"></i>
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
            <label className="field">
              <span>Confirm Password</span>
              <span className="input-with-icon password-input">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.7 18.2 7v4.4c0 3.5-2.4 6.2-6.2 7.7-3.8-1.5-6.2-4.2-6.2-7.7V7L12 3.7Z" />
                  <path d="M9.4 13.1 11.2 15l3.8-4.2" />
                </svg>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  defaultValue="Scholar2024"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.6 17.6L20 20M9.8 9.8a3 3 0 114.2 4.2M2 12s3-5.5 10-5.5a9.8 9.8 0 014.2.9M6.8 17.2A10.4 10.4 0 012 12M12 17.5c2.8 0 5.4-1.2 7-3.3M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </svg>
                  )}
                </button>
              </span>
            </label>
            <label className="terms-check">
              <input type="checkbox" />
              <span>
                I agree to the <a href="/">Terms &amp; Conditions</a> and{" "}
                <a href="/">Privacy Policy</a>.
              </span>
            </label>
            <button className="auth-submit" type="submit">
              Register Account
            </button>
            <div className="auth-divider">
              <span>OR</span>
            </div>
            <div className="login-providers">
              <button
                className="google-login-button google-auth-button"
                type="button"
              >
                <svg
                  className="google-mark"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M21.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.46Z" />
                  <path d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
                  <path d="M6.41 13.92A6.01 6.01 0 0 1 6.09 12c0-.66.12-1.31.32-1.92V7.49H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.51l3.34-2.59Z" />
                  <path d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.97 12 5.97Z" />
                </svg>
                Continue with Google
              </button>
              <button className="institution-login-button" type="button">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3.5 9.2 12 4.5l8.5 4.7" />
                  <path d="M5.5 10.6h13" />
                  <path d="M7.2 10.6v6.8M12 10.6v6.8M16.8 10.6v6.8" />
                  <path d="M4.6 19.5h14.8" />
                  <path d="M9.5 7.8h5" />
                </svg>
                Institutional ID
              </button>
              <button className="orcid-login-button" type="button">
                <span className="orcid-mark" aria-hidden="true">
                  iD
                </span>
                ORCID
              </button>
            </div>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <a href="/login" onClick={navTo("/login")}>
              Login
            </a>
          </p>
        </div>

        <aside
          className="auth-visual-panel"
          aria-label="ScholarTrend discovery preview"
        >
          <div className="orbit-visual" aria-hidden="true">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="orbit orbit-three"></div>
            <div className="research-plane"></div>
            <div className="spark-field">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="visual-copy">
            <div className="accent-line" aria-hidden="true"></div>
            <div>
              <h2>Accelerate Discovery</h2>
              <p>
                Join researchers and institutions using analytical intelligence
                to uncover publication trends and drive scientific progress.
              </p>
            </div>
          </div>
          <div className="auth-stats">
            <div>
              <span>Publications Tracked</span>
              <strong>14.2M+</strong>
            </div>
            <div>
              <span>Global Institutions</span>
              <strong>8,450</strong>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState(() => {
    return (
      window.localStorage.getItem("scholartrend.login.email") ||
      "researcher@university.edu"
    );
  });
  const [password, setPassword] = React.useState("Scholar2024");
  const [selectedRole, setSelectedRole] = React.useState("Researcher");
  const [rememberMe, setRememberMe] = React.useState(() => {
    return (
      window.localStorage.getItem("scholartrend.login.remember") === "true"
    );
  });
  const [feedback, setFeedback] = React.useState(null);

  const roleRoutes = {
    Researcher: "/researcher-dashboard",
    Lecturer: "/lecturer-dashboard",
    Student: "/student-dashboard",
    Administrator: "/admin-dashboard",
  };

  const roleEmails = {
    Researcher: "researcher@university.edu",
    Lecturer: "lecturer@university.edu",
    Student: "student@university.edu",
    Administrator: "admin@university.edu",
  };

  const academicAccounts = {
    "researcher@university.edu": {
      password: "Scholar2024",
      role: "Researcher",
      route: "/researcher-dashboard",
    },
    "lecturer@university.edu": {
      password: "Scholar2024",
      role: "Lecturer",
      route: "/lecturer-dashboard",
    },
    "student@university.edu": {
      password: "Scholar2024",
      role: "Student",
      route: "/student-dashboard",
    },
    "admin@university.edu": {
      password: "Scholar2024",
      role: "Administrator",
      route: "/admin-dashboard",
    },
  };

  const goToWorkspace = (route) => {
    window.history.pushState({}, "", route);
    window.dispatchEvent(new Event("scholartrend:navigate"));
  };

  const handleRoleSelect = (nextRole) => {
    const normalizedEmail = email.trim().toLowerCase();

    setSelectedRole(nextRole);

    if (
      !normalizedEmail ||
      Object.values(roleEmails).includes(normalizedEmail)
    ) {
      setEmail(roleEmails[nextRole]);
    }
  };

  const handleLogin = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const account = academicAccounts[normalizedEmail];

    if (!normalizedEmail || !password) {
      setFeedback({
        type: "error",
        text: "Please enter both your academic email and password.",
      });
      return;
    }

    if (
      !account ||
      account.password !== password ||
      account.role !== selectedRole
    ) {
      setFeedback({
        type: "error",
        text: "We could not verify this ScholarTrend role. Try researcher, lecturer, student, or admin @university.edu with Scholar2024 and the matching role.",
      });
      return;
    }

    if (rememberMe) {
      window.localStorage.setItem("scholartrend.login.email", normalizedEmail);
      window.localStorage.setItem("scholartrend.login.remember", "true");
    } else {
      window.localStorage.removeItem("scholartrend.login.email");
      window.localStorage.removeItem("scholartrend.login.remember");
    }

    window.localStorage.setItem(
      "scholartrend.session",
      JSON.stringify({
        email: normalizedEmail,
        role: account.role,
        signedInAt: new Date().toISOString(),
      }),
    );

    setFeedback({
      type: "success",
      text: `${account.role} profile verified. Loading your research trend workspace...`,
    });

    window.setTimeout(() => goToWorkspace(account.route), 550);
  };

  const handleForgotPassword = (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setFeedback({
        type: "error",
        text: "Enter your academic email first so ScholarTrend can prepare a reset link.",
      });
      return;
    }

    setFeedback({
      type: "success",
      text: `Password reset instructions were prepared for ${normalizedEmail}.`,
    });
  };

  const handleGoogleLogin = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const route = roleRoutes[selectedRole];

    window.localStorage.setItem(
      "scholartrend.session",
      JSON.stringify({
        email: normalizedEmail || "google.researcher@university.edu",
        role: selectedRole,
        provider: "Google",
        signedInAt: new Date().toISOString(),
      }),
    );

    setFeedback({
      type: "success",
      text: `Google academic profile connected as ${selectedRole}. Loading your research trend workspace...`,
    });

    window.setTimeout(() => goToWorkspace(route), 550);
  };

  const handleAcademicProviderLogin = (provider) => {
    const normalizedEmail = email.trim().toLowerCase();
    const route = roleRoutes[selectedRole];

    window.localStorage.setItem(
      "scholartrend.session",
      JSON.stringify({
        email:
          normalizedEmail ||
          `${selectedRole.toLowerCase()}.${provider.toLowerCase()}@university.edu`,
        role: selectedRole,
        provider,
        signedInAt: new Date().toISOString(),
      }),
    );

    setFeedback({
      type: "success",
      text: `${provider} verified your ${selectedRole} profile. Loading your research trend workspace...`,
    });

    window.setTimeout(() => goToWorkspace(route), 550);
  };

  return (
    <main className="login-shell" aria-label="Login">
      <section className="login-wrap">
        <div className="login-logo">
          <Brand />
          <span>Analytical Intelligence</span>
        </div>

        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-card-bar"></div>
          <h1>Welcome back</h1>
          <p>Please enter your credentials to access your dashboard.</p>

          <label className="field login-field">
            <span>Email Address</span>
            <span className="input-with-icon">
              <span className="icon-container">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient
                      id="emailGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M4 6.5h16v11H4z"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="m5.2 7.7 6.8 5 6.8-5"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M17.5 4.2v2.2M16.4 5.3h2.2"
                    fill="none"
                    stroke="url(#emailGrad)"
                    strokeWidth="1.4"
                  />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </span>
          </label>

          <div className="field login-field role-field">
            <span>Academic Role</span>
            <div
              className="role-picker"
              role="radiogroup"
              aria-label="Academic Role"
            >
              {["Researcher", "Lecturer", "Student", "Administrator"].map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-choice ${
                      selectedRole === role ? "active" : ""
                    }`}
                    role="radio"
                    aria-checked={selectedRole === role}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {role === "Student" ? (
                        <>
                          <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
                          <path d="M7 12v3.2c0 1.8 2 3 5 3s5-1.2 5-3V12" />
                        </>
                      ) : role === "Lecturer" ? (
                        <>
                          <path d="M4 5.5h16v11H4z" />
                          <path d="M8 20h8" />
                          <path d="M9 10h6M9 13h4" />
                        </>
                      ) : role === "Administrator" ? (
                        <>
                          <path d="M12 3.5 19 7v5c0 4-2.8 7-7 8.5C7.8 19 5 16 5 12V7l7-3.5Z" />
                          <path d="M9.4 12.2 11.2 14l3.6-4" />
                        </>
                      ) : (
                        <>
                          <path d="M5 19V5l7 3 7-3v14l-7-3-7 3Z" />
                          <path d="M12 8v8" />
                        </>
                      )}
                    </svg>
                    <span>{role}</span>
                  </button>
                ),
              )}
            </div>
          </div>

          <label className="field login-field">
            <span>Password</span>
            <span className="input-with-icon password-input">
              <span className="icon-container">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <defs>
                    <linearGradient
                      id="lockGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="currentColor"
                        stopOpacity="1"
                      />
                      <stop
                        offset="100%"
                        stopColor="currentColor"
                        stopOpacity="0.7"
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 3.6 18.5 7v4.6c0 3.6-2.5 6.4-6.5 8-4-1.6-6.5-4.4-6.5-8V7L12 3.6Z"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M9.2 11.2V10a2.8 2.8 0 0 1 5.6 0v1.2"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <rect
                    x="8.6"
                    y="11.2"
                    width="6.8"
                    height="5"
                    rx="1.2"
                    fill="none"
                    stroke="url(#lockGrad)"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="12"
                    cy="13.8"
                    r="1"
                    fill="currentColor"
                    opacity="0.8"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient
                        id="eyeHideGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity="0.6"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M3 3l18 18M5 5c-1.5 1.5-3 3.5-3 7 0 6 4 9 10 9 2.5 0 4.5-1 6-2.5M19 5c1.5 1.5 3 3.5 3 7 0 6-4 9-10 9-2.5 0-4.5-1-6-2.5"
                      fill="none"
                      stroke="url(#eyeHideGrad)"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                      fill="none"
                      stroke="url(#eyeHideGrad)"
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <defs>
                      <linearGradient
                        id="eyeShowGrad"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="currentColor"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="currentColor"
                          stopOpacity="0.6"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M12 5C6.5 5 2.5 8.5 2.5 12c0 3.5 4 7 9.5 7s9.5-3.5 9.5-7-4-7-9.5-7Z"
                      fill="none"
                      stroke="url(#eyeShowGrad)"
                      strokeWidth="1.8"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="url(#eyeShowGrad)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="1.5"
                      fill="currentColor"
                      opacity="0.8"
                    />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <div className="login-options">
            <label>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />{" "}
              Remember me
            </label>
            <a href="/" onClick={handleForgotPassword}>
              Forgot password?
            </a>
          </div>

          {feedback && (
            <p
              className={`login-feedback ${feedback.type}`}
              role={feedback.type === "error" ? "alert" : "status"}
            >
              {feedback.text}
            </p>
          )}

          <button className="login-submit" type="submit">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4.5 17.5 9 13l3.2 2.6 6.3-7.1" />
              <path d="M15.5 8.5h3v3" />
              <path d="M5 20h14" />
              <path d="M7 15v3M12 12v6M17 10v8" />
            </svg>
            <span>Sign In</span>
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="login-providers">
            <button
              className="google-login-button"
              type="button"
              onClick={handleGoogleLogin}
            >
              <svg
                className="google-mark"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M21.6 12.23c0-.75-.07-1.47-.19-2.16H12v4.09h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.31 2.98-7.46Z" />
                <path d="M12 22c2.7 0 4.96-.89 6.62-2.41l-3.24-2.51c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.59-4.11H3.07v2.59A9.99 9.99 0 0 0 12 22Z" />
                <path d="M6.41 13.92A6.01 6.01 0 0 1 6.09 12c0-.66.12-1.31.32-1.92V7.49H3.07A9.99 9.99 0 0 0 2 12c0 1.61.39 3.13 1.07 4.51l3.34-2.59Z" />
                <path d="M12 5.97c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2a9.99 9.99 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.97 12 5.97Z" />
              </svg>
              Continue with Google
            </button>
            <button
              className="orcid-login-button"
              type="button"
              onClick={() => handleAcademicProviderLogin("ORCID")}
            >
              <span className="orcid-mark" aria-hidden="true">
                iD
              </span>
              Continue with ORCID
            </button>
            <button
              className="institution-login-button"
              type="button"
              onClick={() => handleAcademicProviderLogin("Institution SSO")}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3.5 9.2 12 4.5l8.5 4.7" />
                <path d="M5.5 10.6h13" />
                <path d="M7.2 10.6v6.8M12 10.6v6.8M16.8 10.6v6.8" />
                <path d="M4.6 19.5h14.8" />
                <path d="M9.5 7.8h5" />
              </svg>
              Continue with Institution SSO
            </button>
          </div>
        </form>

        <p className="login-switch">
          Don't have an account?{" "}
          <a href="/register" onClick={navTo("/register")}>
            Sign up
          </a>
        </p>
      </section>
    </main>
  );
}

const sidebarItems = [
  {
    label: "Dashboard",
    route: "/student-dashboard",
    icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z",
  },
  {
    label: "Search",
    route: "/student-search",
    icon: "M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20",
  },
  {
    label: "Bookmarks",
    route: "/student-bookmarks",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Notifications",
    route: "/student-notifications",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
  },
];

const statCards = [
  {
    label: "My Bookmarks",
    value: "42",
    note: "+3 this week",
    tone: "green",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Followed Keywords",
    value: "12",
    note: "Active",
    tone: "gray",
    icon: "M5 7h14M5 12h14M5 17h14",
  },
  {
    label: "Unread Alerts",
    value: "5",
    note: "Needs review",
    tone: "gray",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
    red: true,
  },
  {
    label: "Recently Viewed",
    value: "18",
    note: "Last 7 days",
    tone: "gray",
    icon: "M12 7v5l3 2M20 12a8 8 0 1 1-2.35-5.65",
  },
];

const publications = [
  {
    tags: ["Computer Science", "Peer Reviewed"],
    title:
      "Neural Network Architectures for Predictive Data Synthesis in High-Noise Environments",
    excerpt:
      "This paper explores novel approaches to structural adjustments within deep learning models when exposed to datasets characterized by extreme signal noise.",
    meta: "Oct 2023  Â·  128 Citations  Â·  IF: 4.2",
  },
  {
    tags: ["Environmental Science"],
    title:
      "Longitudinal Analysis of Urban Heat Island Mitigation Strategies in Coastal Metropolises",
    excerpt:
      "A comprehensive ten-year study evaluating the efficacy of green roof implementations and reflective surface treatments across five major coastal cities.",
    meta: "Sep 2023  Â·  54 Citations  Â·  IF: 3.8",
  },
];

const activities = [
  [
    "Quantum Cryptography Protocols",
    "Viewed 2 hours ago",
    "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z",
  ],
  [
    "Dataset: Global Emiss...",
    "Downloaded yesterday",
    "M12 4v10M8 10l4 4 4-4M5 19h14",
  ],
  [
    "Sociological Impact of AI",
    "Bookmarked 3 days ago",
    "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  ],
  [
    "Advanced Polymer Synthesis",
    "Viewed 1 week ago",
    "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z",
  ],
];

const searchResults = [
  {
    title: "Attention Is All You Need",
    authors:
      "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
    abstract:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism.",
    year: "2017",
    source: "NeurIPS",
    citations: "99,842",
    saved: false,
  },
  {
    title: "Deep Residual Learning for Image Recognition",
    authors: "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
    abstract:
      "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously.",
    year: "2016",
    source: "CVPR",
    citations: "152,109",
    saved: true,
  },
];

const bookmarkTabs = ["Publications", "Keywords", "Journals", "Topics"];

const bookmarkedPapers = [
  {
    title:
      "Attention Is All You Need: A Retrospective Analysis of Transformer Architectures",
    excerpt:
      "This paper reviews the impact of the original Transformer architecture introduced in 2017, analyzing its adaptations across various domains including natural language processing, computer vision, and computational biology over the last five years.",
    date: "Oct 2023",
    citations: "14,203",
    impact: "High",
  },
  {
    title: "Quantum Supremacy using a Programmable Superconducting Processor",
    excerpt:
      'We report the demonstration of quantum supremacy. We developed a new 54-qubit processor, named "Sycamore", that is comprised of fast, high-fidelity quantum logic gates, in order to perform the benchmark testing.',
    date: "Oct 2019",
    citations: "451",
    impact: "High",
  },
];

const bookmarkedKeywords = [
  { name: "Deep Learning", count: "128 papers", trend: "+12% this week" },
  { name: "Quantum Computing", count: "45 papers", trend: "+5% this week" },
  { name: "Computational Biology", count: "89 papers", trend: "Stable" },
];

const bookmarkedJournals = [
  {
    name: "Nature Computational Science",
    impactFactor: "12.3",
    status: "Active alerts",
  },
  {
    name: "Journal of Machine Learning Research",
    impactFactor: "8.5",
    status: "Weekly digest",
  },
  { name: "Bioinformatics", impactFactor: "6.9", status: "Monthly digest" },
];

const bookmarkedTopics = [
  {
    name: "Manifold Learning",
    tracked: "32 papers",
    activity: "High activity",
  },
  {
    name: "Predictive Data Synthesis",
    tracked: "14 papers",
    activity: "Medium activity",
  },
  {
    name: "Neural Network Architectures",
    tracked: "55 papers",
    activity: "Low activity",
  },
];

const notificationFilters = [
  {
    title: "Filters",
    options: [
      { label: "All Notifications", active: true },
      { label: "Unread" },
    ],
  },
  {
    title: "",
    options: [
      { label: "Any Time", active: true },
      { label: "Today" },
      { label: "This Week" },
    ],
  },
];

const notificationItems = [
  {
    type: "TOPIC ALERT",
    time: "Just now",
    title: "NEW TOPIC MATCH:",
    text: 'A new publication titled "Advancements in Neural Architecture Search" matches your interest in Deep Learning. Similarity: 92%.',
    icon: "M12 4.5v15M6 8.5c2.4-.8 4.4-.4 6 1.2 1.6-1.6 3.6-2 6-1.2v8.5c-2.4-.8-4.4-.4-6 1.2-1.6-1.6-3.6-2-6-1.2V8.5ZM9 12h1.8M13.2 12H15",
    tone: "purple",
    unread: true,
    bookmarked: true,
  },
  {
    type: "TREND ALERT",
    time: "10 mins ago",
    title: "",
    text: 'Keyword "Transformer Models" is showing a 34% spike in citations this month across top-tier ML journals.',
    icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
    tone: "green",
    unread: true,
  },
  {
    type: "NEW PUBLICATION",
    time: "2 hours ago",
    title: "",
    text: '5 new publications match your followed keyword "Quantum Computing Scaling" in Nature Physics.',
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    tone: "purple-soft",
    unread: true,
  },
  {
    type: "SYSTEM",
    time: "yesterday",
    title: "",
    text: "Sync management encountered a delay integrating the latest ArXiv dataset. The issue has been resolved.",
    icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8",
    tone: "gray",
  },
  {
    type: "NEW PUBLICATION",
    time: "3 days ago",
    title: "",
    text: 'Dr. E. Thorne, whom you follow, published a new paper: "Neuroplasticity in Adult Avian Models."',
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    tone: "purple-soft",
  },
];

const profileTabs = [
  {
    label: "Personal Info",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    active: true,
  },
  {
    label: "Academic Identity",
    icon: "M4 6.5h16v11H4zM8 10h8M8 13h5M17 4v4M15 6h4",
  },
  {
    label: "Change Password",
    icon: "M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10",
  },
  { label: "Research Interests", icon: "M12 4l7 16H5l7-16ZM9.8 14h4.4" },
  { label: "Preferences", icon: "M5 7h14M8 12h8M10 17h4" },
];

const relatedPublications = [
  {
    title: "Topological Data Analysis in Genomics",
    authors: "Zhang et al.",
    meta: "Bioinformatics (2022)",
    stats: "892 Citations  |  Impact: 7.2",
  },
  {
    title: "Benchmarking Dimensionality Reduction Methods",
    authors: "Chen, L., Gupta, S.",
    meta: "Nature Methods (2021)",
    stats: "2,105 Citations  |  Impact: 14.5",
  },
];

const researcherNavGroups = [
  {
    items: [
      {
        label: "Dashboard",
        route: "/researcher-dashboard",
        icon: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6zM7 8h.01M17 8h.01M7 17h.01M17 17h.01",
      },
      {
        label: "Search",
        route: "/researcher-search",
        icon: "M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6",
      },
      {
        label: "Bookmarks",
        route: "/researcher-bookmarks",
        icon: "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h5",
      },
      {
        label: "Notifications",
        route: "/researcher-notifications",
        icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2",
      },
    ],
  },
  {
    heading: "Analysis",
    items: [
      {
        label: "Trend Tracking",
        route: "/researcher-trend-tracking",
        icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
      },
      {
        label: "Reports",
        route: "/researcher-reports",
        icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 15V9M12 15v-3M15 15v-5",
      },
      {
        label: "Year Comparison",
        route: "/researcher-year-comparison",
        icon: "M5 6h4v13H5zM15 4h4v15h-4zM10.5 10h3M10.5 14h3M4 20h16",
      },
    ],
  },
  {
    heading: "Lecturer",
    items: [
      {
        label: "Sync Management",
        route: "/researcher-sync-management",
        icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8",
      },
    ],
  },
];

const researcherStats = [
  {
    label: "Total Publications",
    value: "124,592",
    note: "+2.4% vs last month",
    tone: "positive",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
  },
  {
    label: "New This Week",
    value: "1,843",
    note: "+12% vs last week",
    tone: "positive",
    icon: "M5 18h14M7 15l4-4 3 2.5 5-6M16 7h3v3M7 7h4",
  },
  {
    label: "Your Bookmarks",
    value: "47",
    note: "3 recently updated",
    tone: "neutral",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15ZM9 8h6M9 11h5",
  },
  {
    label: "Unread Alerts",
    value: "12",
    note: "5 high priority",
    tone: "danger",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2",
  },
];

const publicationGrowthData = [
  { year: 2014, publications: 14592 },
  { year: 2015, publications: 19840 },
  { year: 2016, publications: 27315 },
  { year: 2017, publications: 36480 },
  { year: 2018, publications: 48720 },
  { year: 2019, publications: 58640 },
  { year: 2020, publications: 61430 },
  { year: 2021, publications: 57180 },
  { year: 2022, publications: 75290 },
  { year: 2023, publications: 80110 },
  { year: 2024, publications: 87240 },
];

const researcherKeywords = [
  { label: "Machine Learning", percent: "+45%", width: "92%" },
  { label: "Climate Change", percent: "+32%", width: "72%" },
  { label: "CRISPR", percent: "+28%", width: "60%" },
  { label: "Quantum Computing", percent: "+15%", width: "48%" },
  { label: "Microplastics", percent: "+12%", width: "32%" },
];

const researcherDomains = [
  { label: "Medicine", value: "40%", color: "#4f46e5" },
  { label: "Engineering", value: "30%", color: "#0f172a" },
  { label: "Biology", value: "20%", color: "#10b981" },
];

const trendMetricCards = [
  {
    label: "Total Pubs",
    value: "142,890",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    bars: [28, 34, 46, 55, 76],
    tone: "volume",
  },
  {
    label: "YoY Growth",
    value: "+18.4%",
    note: "vs last year",
    icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
    bars: [35, 43, 48, 57, 83],
    tone: "growth",
  },
  {
    label: "Trending Score A",
    sublabel: "(Raw)",
    value: "94.2",
    note: "+1.2",
    icon: "M5 19h14M8 15v-5M12 15V7M16 15v-8M7 5h2M11 4h2M15 3h2",
    score: 94,
    tone: "score-a",
  },
  {
    label: "Trending Score B",
    sublabel: "(Rate)",
    value: "88.7",
    note: "+4.5",
    icon: "M12 4v3M12 17v3M4 12h3M17 12h3M7.8 7.8l2.8 2.8M16.2 7.8 13 11M8 16l3-3M12 12l4.2 4.2",
    score: 89,
    tone: "score-b",
  },
];

const trendLineData = [
  { year: 2019, value: 11700 },
  { year: 2020, value: 14500 },
  { year: 2021, value: 21400 },
  { year: 2022, value: 42600 },
  { year: 2023, value: 62700 },
];

const trendTopRaw = [
  { keyword: "Deep Learning", count: "45,210", values: [38, 48, 62, 76, 92] },
  { keyword: "Neural Networks", count: "38,902", values: [30, 44, 58, 68, 84] },
  { keyword: "NLP", count: "29,450", values: [24, 36, 42, 63, 75] },
  { keyword: "Computer Vision", count: "25,100", values: [34, 39, 48, 54, 69] },
  {
    keyword: "Reinforcement Learning",
    count: "18,320",
    values: [18, 28, 38, 50, 64],
  },
];

const trendTopGrowth = [
  { keyword: "Large Language Models", growth: "+850%" },
  { keyword: "Generative AI", growth: "+420%" },
  { keyword: "Prompt Engineering", growth: "+315%" },
  { keyword: "Federated Learning", growth: "+180%" },
  { keyword: "Quantum ML", growth: "+145%" },
];

const trendVolumeRows = [
  {
    discipline: "Computer Science",
    values: ["8,400", "10,200", "14,500", "28,000", "42,100"],
    total: "103,200",
  },
  {
    discipline: "Medicine & Health",
    values: ["1,200", "1,800", "3,100", "6,500", "11,200"],
    total: "23,800",
  },
  {
    discipline: "Engineering",
    values: ["2,100", "2,500", "3,800", "8,100", "9,400"],
    total: "25,900",
  },
  {
    discipline: "Aggregated Total",
    values: ["11,700", "14,500", "21,400", "42,600", "62,700"],
    total: "152,900",
    summary: true,
  },
];

const trendTopicFilters = [
  "All Topics",
  "Artificial Intelligence",
  "Systems Biology",
  "Quantum Computing",
  "Nanotechnology",
  "Neuroscience",
];

const trendKeywordOverview = [
  {
    keyword: "Transformers",
    category: "Artificial Intelligence",
    mentions: "12,450",
    change: "+42%",
    tone: "up",
  },
  {
    keyword: "CRISPR-Cas9",
    category: "Biotechnology",
    mentions: "8,920",
    change: "+28%",
    tone: "up",
    selected: true,
  },
  {
    keyword: "LLMs",
    category: "Artificial Intelligence",
    mentions: "15,300",
    change: "+156%",
    tone: "up",
  },
  {
    keyword: "Graphene",
    category: "Materials Science",
    mentions: "5,102",
    change: "-4%",
    tone: "down",
  },
];

const reportMetrics = [
  "Publication Count",
  "Growth Rate",
  "Trending Score A",
  "Trending Score B",
  "Top Authors",
  "Top Journals",
  "Citation Analysis",
];

const reportHistoryRows = [
  { name: "ML_Nature_Sci_18_23.xlsx", date: "Today, 14:32", format: "Excel" },
  { name: "Genomics_Growth_Q3.csv", date: "Yesterday, 09:15", format: "CSV" },
  { name: "Author_Analysis_AI.xlsx", date: "Oct 12, 2023", format: "Excel" },
];

const yearMetricCards = [
  {
    label: "Total Publications",
    value: "12,450",
    note: "+8.4%",
    icon: "M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5M9 17h3",
    bars: [28, 46, 38, 50, 66, 78],
  },
  {
    label: "Total Citations",
    value: "84,201",
    note: "+12.1%",
    extra: "99",
    icon: "M5 19h14M8 16V9M12 16V7M16 16v-5M7 5h2M11 4h2M15 6h2",
    bars: [24, 36, 29, 43, 58, 70],
  },
  {
    label: "Top Keyword Shift",
    value: "Machine Lear",
    subvalue: "Stable",
    icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14",
    ranks: ["Rank #1 (2024)", "Rank #1 (2025)"],
  },
  {
    label: "Top Journal Divergence",
    value: "Nature Comm.",
    subvalue: "2 Rank",
    icon: "M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3M8 10h2M14 10h2M8 13h2M14 13h2",
    ranks: ["Rank #2 (2024)", "Rank #4 (2025)"],
    danger: true,
  },
];

const yearKeywordDiff = [
  { keyword: "LLMs", delta: "+245%", tone: "up" },
  { keyword: "CRISPR", delta: "+88%", tone: "up" },
  { keyword: "Data Mining", delta: "--", tone: "flat" },
  { keyword: "Hadoop", delta: "-42%", tone: "down" },
  { keyword: "Blockchain", delta: "-18%", tone: "down" },
  { keyword: "Web3", delta: "-65%", tone: "down" },
];

const yearTrajectoryData = [
  { quarter: "Q1", baseline: 280, comparison: 340 },
  { quarter: "Q2", baseline: 560, comparison: 760 },
  { quarter: "Q3", baseline: 500, comparison: 1080 },
  { quarter: "Q4", baseline: 900, comparison: 1260 },
  { quarter: "Q4", baseline: 820, comparison: 1420 },
];

const syncSourceCards = [
  {
    name: "Semantic Scholar API",
    role: "Primary metadata source",
    status: "Connected",
    statusTone: "healthy",
    synced: "128,420",
    latency: "184 ms",
    coverage: "96%",
  },
  {
    name: "OpenAlex API",
    role: "RQ2 comparison sample",
    status: "Compare-only",
    statusTone: "warning",
    synced: "24,880",
    latency: "231 ms",
    coverage: "Sample",
  },
];

const syncPipelineSteps = [
  {
    label: "Fetch Publication Metadata",
    detail: "DOI, title, authors, venue, abstract",
    state: "complete",
  },
  {
    label: "Normalize Schema",
    detail: "Map API fields into ScholarTrend database",
    state: "active",
  },
  {
    label: "Deduplicate Records",
    detail: "Merge by DOI, Semantic Scholar ID, OpenAlex ID",
    state: "queued",
  },
  {
    label: "Persist to Database",
    detail: "Write publication, author, keyword relations",
    state: "queued",
  },
];

const syncJobs = [
  {
    job: "Nightly Semantic Scholar Refresh",
    schedule: "02:00 daily",
    lastRun: "Today, 02:03",
    duration: "18m 42s",
    status: "Succeeded",
  },
  {
    job: "OpenAlex RQ2 Sample Compare",
    schedule: "Saturday",
    lastRun: "Jun 15, 09:00",
    duration: "07m 11s",
    status: "Succeeded",
  },
  {
    job: "Metadata Normalization Sweep",
    schedule: "Every 6 hours",
    lastRun: "Today, 12:00",
    duration: "04m 36s",
    status: "Running",
  },
];

const syncLogs = [
  {
    time: "14:21:09",
    level: "Info",
    message: "Normalized 1,284 publication records into canonical schema.",
  },
  {
    time: "14:19:44",
    level: "Warn",
    message:
      "OpenAlex sample returned 18 records without DOI; matched by title similarity.",
  },
  {
    time: "14:17:02",
    level: "Error",
    message:
      "Semantic Scholar rate limit hit for batch #42. Retry scheduled in 120 seconds.",
  },
  {
    time: "14:12:18",
    level: "Info",
    message: "Hangfire job Metadata Normalization Sweep started.",
  },
];

const graphPaper = {
  title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
  authors:
    "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez, C. McCool",
  year: "2016",
  venue: "Sensors Journal",
  similarity: "98.2%",
  citations: "1,429",
  abstract:
    "This paper presents a novel approach to fruit detection using deep convolutional neural networks. The aim is to build an accurate, fast and reliable fruit detection system, which is a vital element of an autonomous agricultural robotic platform.",
  accessPoints: ["PDF via IEEE Xplore", "arXiv:1604.04770"],
};

const graphNodes = [
  {
    id: "deepfruits",
    label: "DeepFruits, 2016",
    x: 360,
    y: 330,
    r: 30,
    selected: true,
  },
  { id: "sa", label: "Sa et al., 2014", x: 372, y: 210, r: 7 },
  { id: "inkyu", label: "Inkyu Sa, 2015", x: 250, y: 285, r: 8 },
  { id: "mccool", label: "McCool, 2016", x: 456, y: 384, r: 13 },
  { id: "bargoti", label: "Bargoti, 2017", x: 286, y: 455, r: 8 },
];

const graphLinks = [
  ["deepfruits", "sa"],
  ["deepfruits", "inkyu"],
  ["deepfruits", "mccool"],
  ["deepfruits", "bargoti"],
];

const graph3DNodes = [
  {
    id: "deepfruits",
    label: "DeepFruits, 2016",
    position: [130, 10, 24],
    size: 48,
    color: "#c3d8d7",
    selected: true,
  },
  {
    id: "tarjan1972",
    label: "Tarjan, 1972",
    position: [60, 72, 8],
    size: 70,
    color: "#b9cecc",
  },
  {
    id: "aho1974",
    label: "Aho, 1974",
    position: [285, -74, -28],
    size: 62,
    color: "#c4d7d6",
  },
  {
    id: "hopcroft1974",
    label: "Hopcroft, 1974",
    position: [-24, -76, 18],
    size: 46,
    color: "#b7cecd",
  },
  {
    id: "lipton1977",
    label: "Lipton, 1977",
    position: [14, 106, -24],
    size: 42,
    color: "#c7d9d9",
  },
  {
    id: "gabow2000",
    label: "Gabow, 2000",
    position: [-74, 92, 28],
    size: 36,
    color: "#608a89",
  },
  {
    id: "gabow1976",
    label: "Gabow, 1976",
    position: [178, 154, -52],
    size: 38,
    color: "#c4d6d5",
  },
  {
    id: "frederickson1987",
    label: "Frederickson, 1987",
    position: [184, 74, -18],
    size: 42,
    color: "#8aa8a8",
  },
  {
    id: "williamson1984",
    label: "Williamson, 1984",
    position: [-185, 12, 30],
    size: 38,
    color: "#b2c9c8",
  },
  {
    id: "boyer1976",
    label: "BoyerEven, 1976",
    position: [-175, -38, 8],
    size: 45,
    color: "#c8d6d4",
  },
  {
    id: "fraysseix1985",
    label: "Fraysseix, 1985",
    position: [-276, 36, -10],
    size: 32,
    color: "#9db8b7",
  },
  {
    id: "fraysseix2006a",
    label: "Fraysseix, 2006",
    position: [-188, 86, 12],
    size: 23,
    color: "#6b9493",
  },
  {
    id: "fraysseix2012",
    label: "Fraysseix, 2012",
    position: [-230, 120, -42],
    size: 18,
    color: "#416f6e",
  },
  {
    id: "boyer2003",
    label: "Boyer, 2003",
    position: [-236, -24, 48],
    size: 27,
    color: "#517b7a",
  },
  {
    id: "shih2003",
    label: "Shih, 2003",
    position: [-298, -64, 16],
    size: 25,
    color: "#6d9998",
  },
  {
    id: "shih1999",
    label: "Shih, 1999",
    position: [-250, -112, 30],
    size: 28,
    color: "#577f7e",
  },
  {
    id: "tamassia1986",
    label: "Tamassia, 1986",
    position: [-340, -126, -8],
    size: 39,
    color: "#91b0af",
  },
  {
    id: "tamassia1987",
    label: "Tamassia, 1987",
    position: [-346, -244, -34],
    size: 42,
    color: "#8fb0af",
  },
  {
    id: "feng1995",
    label: "Feng, 1995",
    position: [-224, -158, 16],
    size: 35,
    color: "#6f9998",
  },
  {
    id: "battista1989",
    label: "Battista, 1989",
    position: [-166, -220, -16],
    size: 37,
    color: "#7fa2a1",
  },
  {
    id: "gutwenger2000",
    label: "Gutwenger, 2000",
    position: [-116, -148, 42],
    size: 40,
    color: "#5d8987",
  },
  {
    id: "booth1976",
    label: "Booth, 1976",
    position: [-62, -196, -26],
    size: 52,
    color: "#bdd2d1",
  },
  {
    id: "kuratowski",
    label: "Kuratowski",
    position: [-58, -326, -38],
    size: 50,
    color: "#9d9d9d",
  },
  {
    id: "junger1998",
    label: "Junger, 1998",
    position: [-248, -266, -18],
    size: 36,
    color: "#5e8887",
  },
  {
    id: "nishizeki1988",
    label: "Nishizeki, 1988",
    position: [-238, -354, 22],
    size: 38,
    color: "#7fa4a3",
  },
  {
    id: "korach1988",
    label: "Korach, 1988",
    position: [-104, 186, 12],
    size: 30,
    color: "#87aaa9",
  },
  {
    id: "korach1993",
    label: "Korach, 1993",
    position: [-24, 162, -10],
    size: 22,
    color: "#85a9a8",
  },
  {
    id: "tarjan1986",
    label: "Tarjan, 1986",
    position: [-110, 96, 36],
    size: 32,
    color: "#b8cfce",
  },
  {
    id: "tarjan2022",
    label: "Tarjan, 2022",
    position: [-14, 248, 32],
    size: 24,
    color: "#426f6f",
  },
  {
    id: "hopcroft1972",
    label: "Hopcroft, 1972",
    position: [30, 142, -58],
    size: 31,
    color: "#cedfdf",
  },
  {
    id: "asano1985",
    label: "Asano, 1985",
    position: [-18, 30, 62],
    size: 35,
    color: "#9db9b8",
  },
  {
    id: "colbourn1981",
    label: "Colbourn, 1981",
    position: [-22, -38, 42],
    size: 32,
    color: "#bed5d4",
  },
  {
    id: "grigoreva1991",
    label: "Grigor'eva, 1991",
    position: [38, -70, 20],
    size: 18,
    color: "#779d9c",
  },
  {
    id: "lueker1979",
    label: "Lueker, 1979",
    position: [78, -236, -12],
    size: 36,
    color: "#b0c8c7",
  },
  {
    id: "hopcroft1971",
    label: "Hopcroft, 1971",
    position: [164, -228, -50],
    size: 30,
    color: "#d5e3e3",
  },
  {
    id: "luks1980",
    label: "Luks, 1980",
    position: [256, -326, -16],
    size: 44,
    color: "#b2cbca",
  },
  {
    id: "hopcroft1974b",
    label: "Hopcroft, 1974",
    position: [222, -250, 12],
    size: 34,
    color: "#c5d8d7",
  },
];

const graph3DLinks = [
  ["deepfruits", "tarjan1972", "strong"],
  ["deepfruits", "hopcroft1974", "strong"],
  ["deepfruits", "lipton1977", "strong"],
  ["deepfruits", "grigoreva1991", "strong"],
  ["deepfruits", "frederickson1987", "strong"],
  ["deepfruits", "aho1974", "faint"],
  ["tarjan1972", "lipton1977", "strong"],
  ["tarjan1972", "gabow2000", "strong"],
  ["tarjan1972", "korach1993", "faint"],
  ["tarjan1972", "tarjan1986", "faint"],
  ["lipton1977", "hopcroft1974", "faint"],
  ["hopcroft1974", "colbourn1981", "strong"],
  ["hopcroft1974", "booth1976", "faint"],
  ["hopcroft1974", "lueker1979", "strong"],
  ["lueker1979", "luks1980", "strong"],
  ["lueker1979", "hopcroft1971", "faint"],
  ["luks1980", "hopcroft1974b", "strong"],
  ["gabow2000", "gabow1976", "faint"],
  ["gabow2000", "hopcroft1972", "faint"],
  ["frederickson1987", "gabow1976", "faint"],
  ["williamson1984", "boyer1976", "strong"],
  ["williamson1984", "fraysseix1985", "strong"],
  ["williamson1984", "fraysseix2006a", "faint"],
  ["boyer1976", "boyer2003", "strong"],
  ["boyer1976", "feng1995", "faint"],
  ["boyer1976", "gutwenger2000", "faint"],
  ["fraysseix1985", "fraysseix2012", "faint"],
  ["fraysseix1985", "shih2003", "strong"],
  ["fraysseix1985", "boyer2003", "faint"],
  ["fraysseix2006a", "fraysseix2012", "strong"],
  ["shih2003", "shih1999", "strong"],
  ["shih1999", "tamassia1986", "faint"],
  ["tamassia1986", "tamassia1987", "strong"],
  ["tamassia1986", "feng1995", "faint"],
  ["feng1995", "battista1989", "faint"],
  ["feng1995", "junger1998", "strong"],
  ["battista1989", "gutwenger2000", "strong"],
  ["junger1998", "nishizeki1988", "faint"],
  ["gutwenger2000", "booth1976", "strong"],
  ["booth1976", "kuratowski", "faint"],
  ["korach1988", "korach1993", "strong"],
  ["korach1988", "tarjan1986", "strong"],
  ["korach1993", "tarjan2022", "faint"],
  ["tarjan1986", "asano1985", "faint"],
  ["asano1985", "colbourn1981", "strong"],
  ["colbourn1981", "booth1976", "faint"],
  ["asano1985", "williamson1984", "faint"],
  ["tarjan1986", "boyer1976", "faint"],
  ["gabow2000", "williamson1984", "faint"],
  ["colbourn1981", "lueker1979", "faint"],
  ["fraysseix1985", "korach1988", "faint"],
  ["boyer1976", "tarjan1986", "faint"],
  ["williamson1984", "asano1985", "faint"],
  ["gutwenger2000", "hopcroft1974", "faint"],
];

const getGraphPaperForNode = (node) => {
  if (!node || node.id === "deepfruits") return graphPaper;

  const [name, rawYear] = node.label.split(", ");
  const year = rawYear || "Network";
  const citationCount = Math.round(
    node.size * 27 +
      Math.abs(node.position[0]) * 1.8 +
      Math.abs(node.position[1]) +
      180,
  );
  const similarity = Math.min(97.6, 82.5 + node.size * 0.18).toFixed(1);

  return {
    title: `${node.label}: Citation Neighborhood`,
    authors: `${name} and related indexed publications`,
    year,
    venue: "ScholarTrend Knowledge Graph",
    similarity: `${similarity}%`,
    citations: citationCount.toLocaleString("en-US"),
    abstract: `${node.label} sits inside a connected citation neighborhood. ScholarTrend ranks this node by graph proximity, citation overlap, and topical similarity to the selected research query.`,
    accessPoints: ["Open citation path", "Inspect related publications"],
  };
};

function MiniIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function StudentSidebar({ activeRoute }) {
  return (
    <aside className="student-sidebar">
      <div className="student-logo">
        <a href="/" onClick={navTo("/")}>
          ScholarTrend
        </a>
        <span>Analytical Intelligence</span>
      </div>

      <nav className="student-nav" aria-label="Student dashboard navigation">
        {sidebarItems.map((item) => (
          <a
            className={item.route === activeRoute ? "active" : ""}
            href={item.route}
            onClick={navTo(item.route)}
            key={item.label}
          >
            <MiniIcon path={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="student-sidebar-footer">
        <a
          className={`sidebar-profile-card ${activeRoute === "/student-profile" ? "active" : ""}`}
          href="/student-profile"
          onClick={navTo("/student-profile")}
        >
          <div className="sidebar-avatar">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Avatar"
            />
          </div>
          <div className="sidebar-profile-info">
            <strong>Dr. A. Scientist</strong>
            <span>Lead Researcher</span>
          </div>
        </a>
      </div>
    </aside>
  );
}

function StudentTopbar({
  crumb = "Dashboard",
  searchValue = "",
  wideSearch = false,
  variant = "default",
  searchPlaceholder = "Search keyword, author, or DOI...",
}) {
  const isProfileUtility = variant === "profile";
  const isUtility = variant === "utility" || isProfileUtility;

  return (
    <header
      className={`student-topbar ${isUtility ? "utility" : ""} ${isProfileUtility ? "profile-utility" : ""}`}
    >
      {crumb ? typeof crumb === "string" ? <span>{crumb}</span> : crumb : null}
      <div className="student-top-actions">
        <form
          className={`student-global-search ${wideSearch ? "wide" : ""}`}
          onSubmit={navTo("/student-search")}
        >
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            defaultValue={searchValue}
          />
        </form>
        <div className="topbar-icon-group">
          <button
            type="button"
            aria-label={isUtility ? "Help" : "Notifications"}
            className={`top-icon ${isUtility ? "" : "alert-dot"}`}
          >
            <MiniIcon
              path={
                isUtility
                  ? "M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  : "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4"
              }
            />
          </button>
          <button type="button" aria-label="Settings" className="top-icon">
            <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
          </button>
          <button
            type="button"
            aria-label="User profile"
            className="student-avatar image-avatar"
          >
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="User profile"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

function StudentDashboard() {
  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-dashboard" />
      <section className="student-main">
        <StudentTopbar />

        <div className="student-content">
          <div className="student-welcome-row">
            <div>
              <h1>Welcome back, Alex</h1>
              <p>
                <span>Student</span> University of Applied Sciences
              </p>
            </div>
            <button type="button" className="new-project">
              + New Project
            </button>
          </div>

          <section className="student-stats" aria-label="Student metrics">
            {statCards.map((card) => (
              <article className="student-stat-card" key={card.label}>
                <div>
                  <span>{card.label}</span>
                  <MiniIcon path={card.icon} />
                </div>
                <strong>{card.value}</strong>
                <p className={card.tone}>{card.note}</p>
              </article>
            ))}
          </section>

          <section className="deep-search" aria-label="Deep dive into research">
            <h2>Deep Dive into Research</h2>
            <p>
              Search across millions of academic papers, journals, and
              analytical reports.
            </p>
            <form onSubmit={navTo("/student-search")}>
              <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
              <input
                type="search"
                placeholder="Search by title, author, DOI, or keyword..."
              />
              <button type="submit">Search</button>
            </form>
            <div className="trending-keywords">
              <span>Trending:</span>
              <a href="/student-dashboard">Machine Learning</a>
              <a href="/student-dashboard">Climate Change Policy</a>
              <a href="/student-dashboard">CRISPR Applications</a>
            </div>
          </section>

          <div className="student-dashboard-grid">
            <section className="recommended-publications">
              <div className="section-title-row">
                <h2>Recommended Publications</h2>
                <a href="/student-dashboard">View all -&gt;</a>
              </div>
              {publications.map((paper) => (
                <article className="publication-card" key={paper.title}>
                  <button
                    type="button"
                    aria-label="Bookmark publication"
                    className="bookmark-button"
                  >
                    <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                  </button>
                  <div className="publication-tags">
                    {paper.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <h3>{paper.title}</h3>
                  <p>{paper.excerpt}</p>
                  <small>{paper.meta}</small>
                </article>
              ))}
            </section>

            <section className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {activities.map(([title, meta, icon], index) => (
                  <a
                    className="activity-item"
                    href="/student-publication"
                    onClick={navTo("/student-publication")}
                    key={title}
                  >
                    <MiniIcon path={icon} />
                    <div>
                      <strong>{title}</strong>
                      <span>{meta}</span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResearcherSidebar({
  activeRoute = "/researcher-dashboard",
  role = "researcher",
  collapsed = false,
  mobileOpen = false,
  onClose,
  onToggleCollapse,
  onUpgrade,
}) {
  return (
    <aside
      className={`researcher-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      <div className="researcher-logo">
        <a href="/" onClick={navTo("/")}>
          ScholarTrend
        </a>
        <span>Analytical Intelligence</span>
        <button
          type="button"
          className="researcher-sidebar-close"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <MiniIcon path="M6 6l12 12M18 6 6 18" />
        </button>
        <button
          type="button"
          className="researcher-sidebar-toggle"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={onToggleCollapse}
        >
          <MiniIcon
            path={
              collapsed
                ? "M8 5.5v13M11 8l4 4-4 4M4.5 5.5h14v13h-14z"
                : "M16 5.5v13M13 8l-4 4 4 4M5.5 5.5h14v13h-14z"
            }
          />
        </button>
      </div>

      <nav
        className="researcher-nav"
        aria-label={`${role === "lecturer" ? "Lecturer" : "Researcher"} dashboard navigation`}
      >
        {researcherNavGroups.map((group, groupIndex) => (
          <div
            className="researcher-nav-group"
            key={group.heading || `primary-${groupIndex}`}
          >
            {group.heading ? <h2>{group.heading}</h2> : null}
            {group.items.map((item) => {
              const itemRoute = getAcademicPath(item.route, role);
              const dashboardRoute = getAcademicPath(
                "/researcher-dashboard",
                role,
              );

              return (
                <a
                  className={
                    itemRoute === activeRoute &&
                    (activeRoute !== dashboardRoute ||
                      item.label === "Dashboard")
                      ? "active"
                      : ""
                  }
                  href={itemRoute}
                  onClick={navTo(itemRoute)}
                  key={`${group.heading || "primary"}-${item.label}`}
                >
                  <MiniIcon path={item.icon} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="researcher-sidebar-footer">
        <button
          type="button"
          className="researcher-upgrade"
          onClick={onUpgrade}
        >
          <MiniIcon path="M12 13.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM9.6 13.1 8.8 19l3.2-1.9 3.2 1.9-.8-5.9M10.5 9.5l1 1 2-2" />
          <span>Upgrade to Pro</span>
        </button>
        <div className="researcher-footer-actions">
          <a
            href={getAcademicPath("/researcher-profile", role)}
            onClick={navTo(getAcademicPath("/researcher-profile", role))}
            aria-label="Profile"
          >
            <MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 18.2a5.7 5.7 0 0 1 10 0" />
            <span>Profile</span>
          </a>
          <button type="button" aria-label="Settings">
            <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

const proPlanFeatures = [
  "Unlimited tracked keywords",
  "Priority trend alerts",
  "Advanced citation intelligence",
  "Full report export suite",
];

function UpgradeProModal({ open, onClose }) {
  const [billingCycle, setBillingCycle] = React.useState("yearly");
  const [upgraded, setUpgraded] = React.useState(false);

  React.useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isYearly = billingCycle === "yearly";

  return (
    <div
      className="upgrade-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <button
          type="button"
          className="upgrade-modal-close"
          aria-label="Close upgrade dialog"
          onClick={onClose}
        >
          <MiniIcon path="M6 6l12 12M18 6 6 18" />
        </button>

        <div className="upgrade-modal-mark" aria-hidden="true">
          <MiniIcon path="M12 13.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM9.6 13.1 8.8 19l3.2-1.9 3.2 1.9-.8-5.9M10.5 9.5l1 1 2-2" />
        </div>

        <div className="upgrade-modal-heading">
          <span>ScholarTrend Pro</span>
          <h2 id="upgrade-modal-title">Upgrade to Pro</h2>
          <p>
            Unlock deeper analytical intelligence for your tracked disciplines.
          </p>
        </div>

        <div className="upgrade-billing-toggle" aria-label="Billing cycle">
          <button
            type="button"
            className={!isYearly ? "active" : ""}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={isYearly ? "active" : ""}
            onClick={() => setBillingCycle("yearly")}
          >
            Yearly <span>Save 20%</span>
          </button>
        </div>

        <div className="upgrade-price-row">
          <strong>{isYearly ? "$19" : "$24"}</strong>
          <span>/ month</span>
        </div>

        <div className="upgrade-feature-list">
          {proPlanFeatures.map((feature) => (
            <div key={feature}>
              <MiniIcon path="M5 12.5 9.5 17 19 7" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="upgrade-primary-action"
          onClick={() => setUpgraded(true)}
        >
          {upgraded ? "Pro Activated" : "Upgrade Now"}
        </button>

        {upgraded ? (
          <p className="upgrade-status" role="status">
            Your Pro workspace is ready in this prototype.
          </p>
        ) : (
          <p className="upgrade-note">Cancel anytime from profile settings.</p>
        )}
      </section>
    </div>
  );
}

function useResearcherSidebarControls() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleMenu = React.useCallback(() => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      setMobileOpen(true);
    } else {
      setCollapsed((value) => !value);
    }
  }, []);

  return {
    collapsed,
    mobileOpen,
    closeMobile: () => setMobileOpen(false),
    handleMenu,
    toggleCollapse: () => setCollapsed((value) => !value),
  };
}

function ResearcherTopbar({
  current = "Dashboard",
  onMenuClick,
  rootLabel = "ScholarTrend",
  rootPath = "/",
  searchPlaceholder = "Search publications, authors, keywords...",
}) {
  return (
    <header className="researcher-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href={rootPath} onClick={navTo(rootPath)}>
          {rootLabel}
        </a>
        <span>&gt;</span>
        <strong>{current}</strong>
      </nav>

      <div className="researcher-top-actions">
        <form
          className="researcher-search"
          onSubmit={navTo("/researcher-search")}
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
          <input type="search" placeholder={searchPlaceholder} />
        </form>
        <button
          type="button"
          className="researcher-top-icon alert-dot"
          aria-label="Notifications"
          onClick={navTo("/researcher-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Researcher profile"
          />
        </button>
      </div>
    </header>
  );
}

function LecturerTopbar({ onMenuClick }) {
  return (
    <header className="researcher-topbar lecturer-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>

      <strong className="lecturer-topbar-title">Dashboard</strong>

      <form
        className="researcher-search lecturer-global-search"
        onSubmit={navTo("/lecturer-search")}
      >
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
        <input
          type="search"
          placeholder="Search keywords, reports, or users..."
          aria-label="Search Lecturer workspace"
        />
      </form>

      <div className="researcher-top-actions lecturer-top-actions">
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Notifications"
          onClick={navTo("/lecturer-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
        >
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <button
          type="button"
          className="researcher-avatar lecturer-avatar"
          aria-label="Lecturer profile"
          onClick={navTo("/lecturer-profile")}
        >
          <span>AT</span>
        </button>
      </div>
    </header>
  );
}

function ResearcherShell({
  activeRoute = "/researcher-dashboard",
  current = "Dashboard",
  topbar = "default",
  pageClassName = "",
  mainClassName = "",
  breadcrumbRootLabel,
  breadcrumbRootPath,
  searchPlaceholder,
  children,
}) {
  const sidebar = useResearcherSidebarControls();
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
  const academicRole = getAcademicRole();
  const isLecturer = academicRole === "lecturer";
  const resolvedActiveRoute = getAcademicPath(activeRoute, academicRole);
  const TopbarComponent =
    topbar === "lecturer" ? (
      <LecturerTopbar onMenuClick={sidebar.handleMenu} />
    ) : topbar === "list" ? (
      <ResearcherListTopbar onMenuClick={sidebar.handleMenu} />
    ) : topbar === "graph" ? (
      <ResearcherSearchTopbar onMenuClick={sidebar.handleMenu} />
    ) : topbar === "publication" ? (
      <ResearcherPublicationTopbar onMenuClick={sidebar.handleMenu} />
    ) : (
      <ResearcherTopbar
        current={current}
        onMenuClick={sidebar.handleMenu}
        rootLabel={breadcrumbRootLabel}
        rootPath={breadcrumbRootPath}
        searchPlaceholder={searchPlaceholder}
      />
    );

  return (
    <main
      className={`researcher-app ${isLecturer ? "lecturer-app" : ""} ${pageClassName} ${sidebar.collapsed ? "sidebar-collapsed" : ""} ${sidebar.mobileOpen ? "sidebar-mobile-open" : ""}`}
    >
      <button
        type="button"
        className="researcher-sidebar-backdrop"
        aria-label="Close navigation"
        onClick={sidebar.closeMobile}
      ></button>
      <ResearcherSidebar
        activeRoute={resolvedActiveRoute}
        role={academicRole}
        collapsed={sidebar.collapsed}
        mobileOpen={sidebar.mobileOpen}
        onClose={sidebar.closeMobile}
        onToggleCollapse={sidebar.toggleCollapse}
        onUpgrade={() => setUpgradeOpen(true)}
      />
      <UpgradeProModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
      <section className={`researcher-main ${mainClassName}`}>
        {TopbarComponent}
        {children}
      </section>
    </main>
  );
}

function ResearcherStatCard({ stat }) {
  return (
    <article className={`researcher-stat ${stat.tone}`}>
      <div className="researcher-stat-label">
        <span>{stat.label}</span>
        <MiniIcon path={stat.icon} />
      </div>
      <strong>{stat.value}</strong>
      <p>{stat.note}</p>
    </article>
  );
}

function PublicationGrowthChart() {
  const [activeIndex, setActiveIndex] = React.useState(
    publicationGrowthData.length - 1,
  );
  const chartWidth = 720;
  const chartHeight = 430;
  const padding = { top: 28, right: 34, bottom: 54, left: 68 };
  const maxValue = 100000;
  const yTicks = [0, 25000, 50000, 75000, 100000];
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const bottom = chartHeight - padding.bottom;
  const formatCount = (value) =>
    value === 0 ? "0" : `${Math.round(value / 1000)}k`;
  const formatFullCount = (value) =>
    new Intl.NumberFormat("en-US").format(value);
  const getX = (index) =>
    padding.left + (index / (publicationGrowthData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = publicationGrowthData.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.publications),
  }));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  const activePoint = points[activeIndex];
  const previousPoint = points[activeIndex - 1];
  const activeDelta = previousPoint
    ? ((activePoint.publications - previousPoint.publications) /
        previousPoint.publications) *
      100
    : 0;
  const latestPoint = points[points.length - 1];
  const previousYear = points[points.length - 2];
  const yearlyGrowth =
    ((latestPoint.publications - previousYear.publications) /
      previousYear.publications) *
    100;
  const tooltipTransform =
    activePoint.x < 130
      ? "translate(0, -112%)"
      : activePoint.x > chartWidth - 130
        ? "translate(-100%, -112%)"
        : "translate(-50%, -112%)";

  return (
    <section
      className="researcher-chart-card"
      aria-label="Publication growth over time"
    >
      <div className="researcher-card-heading">
        <div>
          <h2>Publication Growth Over Time</h2>
          <p>10-year trend analysis across indexed databases</p>
        </div>
        <button type="button" aria-label="Chart options">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <div
        className="chart-summary"
        aria-label="Current publication growth summary"
      >
        <span>
          <strong>{formatFullCount(latestPoint.publications)}</strong>{" "}
          publications in {latestPoint.year}
        </span>
        <span className={yearlyGrowth >= 0 ? "positive" : "danger"}>
          {yearlyGrowth >= 0 ? "+" : ""}
          {yearlyGrowth.toFixed(1)}% YoY
        </span>
      </div>

      <div className="growth-chart">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-labelledby="growthChartTitle"
        >
          <title id="growthChartTitle">
            Publication growth chart from 2014 to 2024 based on yearly
            publication counts.
          </title>
          <defs>
            <linearGradient id="growthArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="chart-grid">
            {yTicks.map((tick) => (
              <path
                key={tick}
                d={`M${padding.left} ${getY(tick)}H${chartWidth - padding.right}`}
              />
            ))}
          </g>
          <path
            className="chart-axis-line"
            d={`M${padding.left} ${bottom}H${chartWidth - padding.right}`}
          />
          <g className="chart-axis-labels y-labels">
            {yTicks.map((tick) => (
              <text
                key={tick}
                x={padding.left - 18}
                y={getY(tick) + 4}
                textAnchor="end"
              >
                {formatCount(tick)}
              </text>
            ))}
          </g>
          <g className="chart-axis-labels x-labels">
            {points.map((point, index) =>
              index % 2 === 0 || index === points.length - 1 ? (
                <text
                  key={point.year}
                  x={point.x}
                  y={chartHeight - 18}
                  textAnchor="middle"
                >
                  {point.year}
                </text>
              ) : null,
            )}
          </g>

          <path className="chart-area" d={areaPath} />
          <path className="chart-line" d={linePath} />
          <path
            className="chart-active-line"
            d={`M${activePoint.x} ${padding.top}V${bottom}`}
          />

          {points.map((point, index) => (
            <g
              className={`chart-point-group ${index === activeIndex ? "active" : ""}`}
              key={point.year}
              tabIndex="0"
              role="button"
              aria-label={`${point.year}: ${formatFullCount(point.publications)} publications`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
            >
              <circle
                className="chart-hit-area"
                cx={point.x}
                cy={point.y}
                r="16"
              />
              <circle
                className="chart-point"
                cx={point.x}
                cy={point.y}
                r={index === activeIndex ? "5" : "4"}
              />
            </g>
          ))}
        </svg>

        <div
          className="chart-tooltip"
          style={{
            left: `${(activePoint.x / chartWidth) * 100}%`,
            top: `${(activePoint.y / chartHeight) * 100}%`,
            transform: tooltipTransform,
          }}
        >
          <span>{activePoint.year}</span>
          <strong>{formatFullCount(activePoint.publications)}</strong>
          <em className={activeDelta >= 0 ? "positive" : "danger"}>
            {previousPoint
              ? `${activeDelta >= 0 ? "+" : ""}${activeDelta.toFixed(1)}% vs previous year`
              : "Baseline year"}
          </em>
        </div>
      </div>
    </section>
  );
}

function TrendingKeywordsCard() {
  return (
    <section className="researcher-side-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Trending Keywords</h2>
          <p>Fastest growing terms in last 30 days</p>
        </div>
      </div>
      <div className="keyword-bars">
        {researcherKeywords.map((keyword, index) => (
          <div className="keyword-bar-row" key={keyword.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="keyword-bar-track">
              <i style={{ width: keyword.width }}></i>
              <strong>{keyword.label}</strong>
            </div>
            <em>{keyword.percent}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResearchDomainsCard() {
  return (
    <section className="researcher-side-card domain-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Top Research Domains</h2>
          <p>Volume distribution</p>
        </div>
      </div>
      <div
        className="domain-donut"
        aria-label="Medicine 40%, Engineering 30%, Biology 20%"
      >
        <span>Total</span>
      </div>
      <div className="domain-legend">
        {researcherDomains.map((domain) => (
          <span key={domain.label}>
            <i style={{ background: domain.color }}></i>
            {domain.label} ({domain.value})
          </span>
        ))}
      </div>
    </section>
  );
}

const lecturerStats = [
  {
    label: "My Bookmarks",
    value: "1,284",
    badge: "â†‘ 12%",
    tone: "blue",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Followed Keywords",
    value: "42",
    badge: "â†‘ 4%",
    tone: "purple",
    icon: "M12 4a8 8 0 1 0 8 8M12 7a5 5 0 1 0 5 5M12 10a2 2 0 1 0 2 2",
  },
  {
    label: "Alerts",
    value: "7 Unread",
    badge: "New",
    tone: "slate",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M7 4.5 5.5 6M17 4.5 18.5 6",
  },
  {
    label: "Research Pulse",
    value: "High Activity",
    tone: "green",
    icon: "M4 12h3l2-4 3.2 8 2.4-5H20M5 5.5h14v13H5z",
  },
];

const lecturerTrendingKeywords = [
  { label: "Neural Networks", value: 85 },
  { label: "Quantum Comp", value: 72 },
  { label: "CRISPR", value: 64 },
  { label: "Machine Learning", value: 58 },
  { label: "Climate Models", value: 45 },
];

const lecturerFieldPublications = [
  {
    title: "Advancements in Generative AI for Academic Synthesis",
    authors: "Smith, J., Doe, A. et al.",
    journal: "Journal of Data Science",
    date: "Oct 2023",
    citations: 124,
  },
  {
    title: "Evaluating Deep Learning Models in Predictive Analytics",
    authors: "Wang, L., Chen, H.",
    journal: "IEEE Transactions",
    date: "Sep 2023",
    citations: 89,
  },
  {
    title: "Sustainable Methodologies in Computational Research",
    authors: "Green, R.",
    journal: "Nature Computational Science",
  },
];

function LecturerStatCard({ stat }) {
  return (
    <article className={`lecturer-stat-card ${stat.tone}`}>
      <div className="lecturer-stat-topline">
        <span className="lecturer-stat-icon">
          <MiniIcon path={stat.icon} />
        </span>
        {stat.badge ? <em>{stat.badge}</em> : null}
      </div>
      <span className="lecturer-stat-label">{stat.label}</span>
      <strong>{stat.value}</strong>
    </article>
  );
}

function LecturerTrendingCard() {
  return (
    <section className="lecturer-dashboard-card lecturer-trending-card">
      <div className="lecturer-card-heading lecturer-trending-heading">
        <span className="lecturer-heading-icon">
          <MiniIcon path="M4 17 9 11l3 3 8-9" />
        </span>
        <h2>Top 5 Trending Keywords</h2>
        <a
          href="/lecturer-trend-tracking"
          onClick={navTo("/lecturer-trend-tracking")}
        >
          Full Trend Tracking
        </a>
        <MiniIcon path="M9 6l6 6-6 6" />
      </div>

      <div className="lecturer-keyword-list">
        {lecturerTrendingKeywords.map((keyword) => (
          <div className="lecturer-keyword-row" key={keyword.label}>
            <strong>{keyword.label}</strong>
            <span className="lecturer-keyword-track" aria-hidden="true">
              <i style={{ width: `${keyword.value}%` }}></i>
            </span>
            <em>{keyword.value}%</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function LecturerPublicationsCard() {
  return (
    <section className="lecturer-dashboard-card lecturer-publications-card">
      <div className="lecturer-card-heading lecturer-publications-heading">
        <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
        <h2>Publications in your field</h2>
        <button type="button" aria-label="Publication options">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <div className="lecturer-publication-list">
        {lecturerFieldPublications.map((publication) => (
          <a
            className="lecturer-publication-item"
            href="/lecturer-publication"
            onClick={navTo("/lecturer-publication")}
            key={publication.title}
          >
            <span className="lecturer-pdf-tile">PDF</span>
            <span className="lecturer-publication-copy">
              <strong>{publication.title}</strong>
              <small>
                {publication.authors} <i>â€¢</i> {publication.journal}
              </small>
              {publication.date ? (
                <em>
                  <span>â–£ {publication.date}</span>
                  <span>âŒ {publication.citations} Citations</span>
                </em>
              ) : null}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function LecturerDashboard() {
  const [exported, setExported] = React.useState(false);

  return (
    <ResearcherShell
      activeRoute="/lecturer-dashboard"
      topbar="lecturer"
      pageClassName="lecturer-dashboard-page"
      mainClassName="lecturer-dashboard-main"
    >
      <div className="lecturer-dashboard-content">
        <div className="lecturer-welcome-row">
          <div>
            <div className="lecturer-title-row">
              <h1>Welcome back, Dr. Aris Thorne</h1>
              <span>Lecturer</span>
            </div>
            <p>
              Here is the latest analytical intelligence for your tracked
              disciplines.
            </p>
          </div>
          <button
            type="button"
            className="lecturer-export-button"
            onClick={() => setExported(true)}
          >
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            {exported ? "Report Exported" : "Export Report"}
          </button>
        </div>

        <section className="lecturer-stat-grid" aria-label="Lecturer metrics">
          {lecturerStats.map((stat) => (
            <LecturerStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="lecturer-dashboard-grid">
          <LecturerTrendingCard />
          <LecturerPublicationsCard />
        </div>
      </div>
    </ResearcherShell>
  );
}

function ResearcherDashboard() {
  return (
    <ResearcherShell activeRoute="/researcher-dashboard" current="Dashboard">
      <div className="researcher-content">
        <div className="researcher-intro-row">
          <p>Here's your latest academic intelligence overview.</p>
          <button type="button" className="researcher-date-filter">
            <MiniIcon path="M7 7h10M9 12h6M11 17h2" />
            Last 30 Days
          </button>
        </div>

        <section className="researcher-stats" aria-label="Researcher metrics">
          {researcherStats.map((stat) => (
            <ResearcherStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="researcher-dashboard-grid">
          <PublicationGrowthChart />
          <aside className="researcher-side-column">
            <TrendingKeywordsCard />
            <ResearchDomainsCard />
          </aside>
        </div>
      </div>

      <button
        type="button"
        className="researcher-download"
        aria-label="Download report"
      >
        <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
      </button>
    </ResearcherShell>
  );
}

function TrendMetricCard({ card }) {
  return (
    <article className={`trend-metric-card ${card.tone}`}>
      <div className="trend-card-label">
        <span>{card.label}</span>
        {card.sublabel ? <em>{card.sublabel}</em> : null}
        <MiniIcon path={card.icon} />
      </div>
      <div className="trend-card-value-row">
        <strong>{card.value}</strong>
        {card.note ? <small>{card.note}</small> : null}
      </div>
      {card.bars ? (
        <div className="trend-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i
              style={{ height: `${height}%` }}
              key={`${card.label}-${index}`}
            ></i>
          ))}
        </div>
      ) : (
        <div className="trend-score-track" aria-hidden="true">
          <i style={{ width: `${card.score}%` }}></i>
        </div>
      )}
    </article>
  );
}

function TrendKeywordsOverview() {
  return (
    <section
      className="trend-keywords-overview"
      aria-label="Top keywords overview"
    >
      <div className="trend-overview-heading">
        <div>
          <span>Dashboard&nbsp; &gt;&nbsp; Trending Keywords</span>
          <h2>Top Keywords Overview</h2>
        </div>
        <div
          className="trend-sort-toggle"
          aria-label="Keyword ranking strategy"
        >
          <button type="button" className="active">
            By Count
          </button>
          <button type="button">By Growth</button>
        </div>
      </div>

      <div className="trend-topic-filters" aria-label="Topic filters">
        {trendTopicFilters.map((filter, index) => (
          <button
            type="button"
            className={index === 0 ? "active" : ""}
            key={filter}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="trend-keyword-card-grid">
        {trendKeywordOverview.map((keyword) => (
          <article
            className={`trend-keyword-card ${keyword.selected ? "selected" : ""}`}
            key={keyword.keyword}
          >
            <div className="trend-keyword-topline">
              <div>
                <h3>{keyword.keyword}</h3>
                <span>{keyword.category}</span>
              </div>
              <button
                type="button"
                aria-label={
                  keyword.selected
                    ? `Selected ${keyword.keyword}`
                    : `Add ${keyword.keyword}`
                }
                onClick={navTo("/researcher-trend-tracking")}
              >
                {keyword.selected ? (
                  <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                ) : (
                  "+"
                )}
              </button>
            </div>
            <div className="trend-keyword-bottomline">
              <div>
                <strong>{keyword.mentions}</strong>
                <span>Mentions</span>
              </div>
              <em className={keyword.tone}>
                {keyword.tone === "up" ? (
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                ) : (
                  <MiniIcon path="M12 5v14M7 14l5 5 5-5" />
                )}
                {keyword.change}
              </em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendMainChart() {
  const width = 860;
  const height = 235;
  const padding = { top: 24, right: 22, bottom: 34, left: 28 };
  const maxValue = 70000;
  const minValue = 0;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const getX = (index) =>
    padding.left + (index / (trendLineData.length - 1)) * plotWidth;
  const getY = (value) =>
    padding.top + (1 - (value - minValue) / (maxValue - minValue)) * plotHeight;
  const points = trendLineData.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.value),
  }));
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const ghostPath = `M ${points[2].x} ${points[2].y} L ${points[3].x} ${getY(56000)} L ${points[4].x} ${getY(66000)}`;

  return (
    <section
      className="trend-panel trend-chart-panel"
      aria-label="Publication trend over time"
    >
      <div className="trend-tabs">
        <button type="button" className="active">
          Publications Over Time
        </button>
        <button type="button">Distribution by Journal</button>
      </div>
      <div className="trend-chart-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Publications over time from 2019 to 2023"
        >
          <g className="trend-grid">
            {[0, 1, 2, 3].map((tick) => (
              <path
                key={tick}
                d={`M${padding.left} ${padding.top + tick * (plotHeight / 3)}H${width - padding.right}`}
              />
            ))}
          </g>
          <path
            className="trend-axis"
            d={`M${padding.left} ${height - padding.bottom}H${width - padding.right}`}
          />
          <path
            className="trend-axis"
            d={`M${padding.left} ${padding.top}V${height - padding.bottom}`}
          />
          <path className="trend-line-primary" d={path} />
          <path className="trend-line-secondary" d={ghostPath} />
          {points.map((point) => (
            <g key={point.year}>
              <circle
                className="trend-point"
                cx={point.x}
                cy={point.y}
                r="4.5"
              />
              <text x={point.x} y={height - 9} textAnchor="middle">
                {point.year}
              </text>
            </g>
          ))}
          <circle
            className="trend-point emphasis"
            cx={points[4].x - 30}
            cy={getY(56000)}
            r="4.5"
          />
          <circle
            className="trend-point emphasis"
            cx={points[4].x}
            cy={getY(62700)}
            r="4.5"
          />
        </svg>
      </div>
    </section>
  );
}

function TrendSparkline({ values }) {
  return (
    <span className="trend-sparkline" aria-hidden="true">
      {values.map((height, index) => (
        <i style={{ height: `${height}%` }} key={index}></i>
      ))}
    </span>
  );
}

function TrendRankingTables() {
  return (
    <div className="trend-ranking-grid">
      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M5 7h14M5 12h14M5 17h14" /> Top 10 by Raw Count
            (Strategy A)
          </h2>
          <button type="button">Export</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Count</th>
              <th>Trend (5y)</th>
            </tr>
          </thead>
          <tbody>
            {trendTopRaw.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td>{row.count}</td>
                <td>
                  <TrendSparkline values={row.values} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" /> Top 10 by
            Growth Rate (Strategy B)
          </h2>
          <button type="button">Export</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Growth %</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {trendTopGrowth.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td className="trend-positive">{row.growth}</td>
                <td>
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function TrendVolumeMatrix() {
  return (
    <section className="trend-panel trend-matrix">
      <h2>Detailed Volume Matrix (Target: Machine Learning)</h2>
      <div className="trend-matrix-scroll">
        <table>
          <thead>
            <tr>
              <th>Discipline / Year</th>
              <th>2019</th>
              <th>2020</th>
              <th>2021</th>
              <th>2022</th>
              <th>2023</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {trendVolumeRows.map((row) => (
              <tr className={row.summary ? "summary" : ""} key={row.discipline}>
                <td>{row.discipline}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.discipline}-${index}`}>{value}</td>
                ))}
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TrendKeywordsPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trending Keywords"
      pageClassName="trend-tracking-page trend-keywords-page"
      mainClassName="trend-keywords-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search publications, authors, keywords..."
    >
      <div className="trend-content trend-keywords-content">
        <TrendKeywordsOverview />
      </div>
    </ResearcherShell>
  );
}

function TrendTrackingDashboardPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trend Tracking"
      pageClassName="trend-tracking-page trend-dashboard-page"
      mainClassName="trend-tracking-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search keywords, authors..."
    >
      <div className="trend-content">
        <section className="trend-hero">
          <div>
            <h1>Trend Tracking</h1>
            <p>
              Analyze keyword velocity and raw publication volume across
              disciplines.
            </p>
          </div>
          <form
            className="trend-filter-panel"
            onSubmit={navTo("/researcher-trend-tracking")}
          >
            <label className="trend-keyword-field">
              <MiniIcon path="M6 5h12M8 12h8M10 19h4" />
              <input
                type="search"
                defaultValue="Machine Learning"
                aria-label="Trend keyword"
              />
              <button type="button" aria-label="Clear keyword">
                x
              </button>
            </label>
            <div className="trend-filter-row">
              <label>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6z" />
                <select
                  defaultValue="Last 5 Years (2019-2023)"
                  aria-label="Date range"
                >
                  <option>Last 5 Years (2019-2023)</option>
                  <option>Last 3 Years (2021-2023)</option>
                  <option>Last 10 Years (2014-2023)</option>
                </select>
              </label>
              <button type="submit">+ Compare</button>
            </div>
          </form>
        </section>

        <section className="trend-metric-grid" aria-label="Trend metrics">
          {trendMetricCards.map((card) => (
            <TrendMetricCard card={card} key={card.label} />
          ))}
        </section>

        <TrendMainChart />
        <TrendRankingTables />
        <TrendVolumeMatrix />
      </div>
    </ResearcherShell>
  );
}

function ReportStepCard({ step, title, icon, children, accent = false }) {
  return (
    <section className={`report-step-card ${accent ? "accent" : ""}`}>
      <h2>
        <MiniIcon path={icon} /> Step {step}: {title}
      </h2>
      {children}
    </section>
  );
}

function ReportsPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-reports"
      current="Reports"
      pageClassName="researcher-reports-page"
      mainClassName="researcher-reports-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search..."
    >
      <div className="reports-content">
        <div className="reports-heading">
          <span>Dashboard&nbsp; &gt;&nbsp; Reports</span>
          <h1>Generate Custom Report</h1>
        </div>

        <div className="reports-layout">
          <aside className="reports-config-column">
            <ReportStepCard
              step="1"
              title="Select Scope"
              icon="M4 5h16l-6 7v5l-4 2v-7L4 5ZM8 8h8M10 12h4"
            >
              <label className="report-field">
                <span>Keywords (Multi-select)</span>
                <div className="report-token-box">
                  <span>
                    machine learning <button type="button">x</button>
                  </span>
                  <span>
                    climate models <button type="button">x</button>
                  </span>
                  <input type="text" placeholder="Type and press enter..." />
                </div>
              </label>
              <label className="report-field">
                <span>Journals (Multi-select)</span>
                <div className="report-empty-select"></div>
              </label>
              <div className="report-year-grid">
                <label className="report-field">
                  <span>Start Year</span>
                  <input type="text" defaultValue="2018" />
                </label>
                <label className="report-field">
                  <span>End Year</span>
                  <input type="text" defaultValue="2023" />
                </label>
              </div>
              <label className="report-field">
                <span>Topics</span>
                <input
                  type="text"
                  defaultValue="e.g. Artificial Intelligence, Genomics"
                />
              </label>
            </ReportStepCard>

            <ReportStepCard
              step="2"
              title="Choose Metrics"
              icon="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 15V9M12 15v-3M15 15v-5"
            >
              <div className="report-metric-options">
                {reportMetrics.map((metric, index) => (
                  <label key={metric}>
                    <input
                      type="checkbox"
                      defaultChecked={index !== 3 && index !== 5}
                    />
                    <span>{metric}</span>
                  </label>
                ))}
              </div>
            </ReportStepCard>

            <ReportStepCard
              step="4"
              title="Export Options"
              icon="M12 4v10M8 10l4 4 4-4M5 19h14M7 6h3M14 6h3"
              accent
            >
              <div className="report-format-options">
                <label>
                  <input type="radio" name="format" defaultChecked />{" "}
                  <span>Excel (.xlsx)</span>
                </label>
                <label>
                  <input type="radio" name="format" /> <span>CSV</span>
                </label>
              </div>
              <label className="report-switch">
                <input type="checkbox" defaultChecked />
                <span>Include raw data sheets</span>
              </label>
              <button type="button" className="report-generate-button">
                <MiniIcon path="M13 3 5 14h6l-1 7 8-11h-6l1-7ZM8 5h2M15 18h2" />
                Generate Report
              </button>
            </ReportStepCard>
          </aside>

          <section className="reports-preview-column">
            <section className="report-preview-card">
              <div className="report-panel-heading">
                <h2>
                  <MiniIcon path="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM16.5 6.5l2-2" />{" "}
                  Step 3: Live Preview
                </h2>
                <button type="button">Sample Data</button>
              </div>
              <div className="report-document-preview">
                <h3>
                  Trend Analysis: Machine Learning in Nature &amp; Science
                  (2018-2023)
                </h3>
                <p>
                  Generated on: [Current Date] â€¢ Scope: 2 Keywords, 2 Journals
                </p>
                <div className="report-preview-metrics">
                  <div>
                    <span>Total Publications</span>
                    <strong>1,245</strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Growth Rate</span>
                    <strong>+14.2%</strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Citations/Paper</span>
                    <strong>42.8</strong>
                    <i></i>
                  </div>
                </div>
                <div
                  className="report-bar-chart"
                  aria-label="Publication bar chart"
                >
                  {[35, 48, 58, 74, 86].map((height, index) => (
                    <i style={{ height: `${height}%` }} key={index}></i>
                  ))}
                  <span></span>
                </div>
                <table className="report-author-table">
                  <thead>
                    <tr>
                      <th>Top Authors</th>
                      <th>Pubs</th>
                      <th>Trend Score A</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>J. Smith et al.</td>
                      <td>42</td>
                      <td>89.4</td>
                    </tr>
                    <tr>
                      <td>A. Johnson</td>
                      <td>38</td>
                      <td>85.1</td>
                    </tr>
                    <tr>
                      <td>L. Williams</td>
                      <td>31</td>
                      <td>72.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-history-card">
              <div className="report-panel-heading">
                <h2>
                  <MiniIcon path="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v5l3 2" />{" "}
                  Report History
                </h2>
                <span>Last 10 reports</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Report Name</th>
                    <th>Date Generated</th>
                    <th>Format</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reportHistoryRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.date}</td>
                      <td>
                        <span
                          className={row.format === "Excel" ? "excel" : "csv"}
                        >
                          {row.format}
                        </span>
                      </td>
                      <td>
                        <a
                          href="/researcher-reports"
                          onClick={navTo("/researcher-reports")}
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a
                className="report-history-link"
                href="/researcher-reports"
                onClick={navTo("/researcher-reports")}
              >
                View all historical reports
              </a>
            </section>
          </section>
        </div>
      </div>
    </ResearcherShell>
  );
}

function YearMetricCard({ card }) {
  return (
    <article className="year-metric-card">
      <div className="year-metric-head">
        <span>{card.label}</span>
        <MiniIcon path={card.icon} />
      </div>
      {card.extra ? <em>{card.extra}</em> : null}
      <strong>{card.value}</strong>
      {card.note ? <small>{card.note}</small> : null}
      {card.bars ? (
        <div className="year-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i style={{ height: `${height}%` }} key={index}></i>
          ))}
        </div>
      ) : (
        <div className="year-rank-grid">
          {card.ranks.map((rank, index) => (
            <span
              className={card.danger && index === 1 ? "danger" : ""}
              key={rank}
            >
              {rank}
            </span>
          ))}
        </div>
      )}
      {card.subvalue ? (
        <b className={card.danger ? "danger" : ""}>{card.subvalue}</b>
      ) : null}
    </article>
  );
}

function YearTrajectoryChart() {
  const width = 660;
  const height = 340;
  const padding = { top: 26, right: 30, bottom: 42, left: 52 };
  const maxValue = 1600;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const getX = (index) =>
    padding.left + (index / (yearTrajectoryData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = yearTrajectoryData.map((item, index) => ({
    ...item,
    x: getX(index),
    yBase: getY(item.baseline),
    yComp: getY(item.comparison),
  }));
  const baselinePath = points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yBase}`,
    )
    .join(" ");
  const comparisonPath = points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yComp}`,
    )
    .join(" ");

  return (
    <section className="year-chart-card">
      <div className="year-chart-heading">
        <h2>
          Publication Volume
          <br />
          Trajectory
        </h2>
        <div className="year-chart-legend">
          <span>
            <i className="baseline"></i> 2024
            <br />
            (Baseline)
          </span>
          <span>
            <i className="comparison"></i> 2025
            <br />
            (Comparison)
          </span>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Publication volume trajectory comparing 2024 and 2025"
      >
        <g className="year-grid">
          {[0, 500, 1000, 1500].map((tick) => (
            <path
              key={tick}
              d={`M${padding.left} ${getY(tick)}H${width - padding.right}`}
            />
          ))}
        </g>
        <g className="year-y-labels">
          {[0, 500, 1000, 1500].map((tick) => (
            <text
              key={tick}
              x={padding.left - 16}
              y={getY(tick) + 4}
              textAnchor="end"
            >
              {tick === 0
                ? "0"
                : `${(tick / 1000).toFixed(tick === 1000 ? 1 : 1)}k`}
            </text>
          ))}
        </g>
        <path
          className="year-axis"
          d={`M${padding.left} ${height - padding.bottom}H${width - padding.right}`}
        />
        <path className="year-baseline-line" d={baselinePath} />
        <path className="year-comparison-line" d={comparisonPath} />
        {points.map((point, index) => (
          <g key={`${point.quarter}-${index}`}>
            <circle
              className="year-comparison-point"
              cx={point.x}
              cy={point.yComp}
              r={index === points.length - 1 ? "9" : "8"}
            />
            {index < 4 ? (
              <text x={point.x} y={height - 12} textAnchor="middle">
                {point.quarter}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
    </section>
  );
}

function YearKeywordDifferential() {
  return (
    <section className="year-keyword-card">
      <div className="year-keyword-heading">
        <h2>Keyword Differential</h2>
        <MiniIcon path="M5 7h14M9 12h10M13 17h6" />
      </div>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {yearKeywordDiff.map((row) => (
            <tr key={row.keyword}>
              <td>{row.keyword}</td>
              <td>
                <span className={row.tone}>{row.delta}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function YearComparisonPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-year-comparison"
      current="Year Comparison"
      pageClassName="researcher-year-page"
      mainClassName="researcher-year-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search..."
    >
      <div className="year-content">
        <section className="year-hero">
          <div>
            <span>Dashboard&nbsp; &gt;&nbsp; Year Comparison</span>
            <h1>Year Comparison Analysis</h1>
          </div>
          <form
            className="year-controls"
            onSubmit={navTo("/researcher-year-comparison")}
          >
            <label>
              Baseline{" "}
              <select defaultValue="2024">
                <option>2024</option>
                <option>2023</option>
              </select>
            </label>
            <MiniIcon path="M8 7h10M14 3l4 4-4 4M16 17H6M10 13l-4 4 4 4" />
            <label>
              Comparison{" "}
              <select defaultValue="2025">
                <option>2025</option>
                <option>2024</option>
              </select>
            </label>
            <button type="submit">
              <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" /> Export Data
            </button>
          </form>
        </section>

        <section
          className="year-metric-grid"
          aria-label="Year comparison metrics"
        >
          {yearMetricCards.map((card) => (
            <YearMetricCard card={card} key={card.label} />
          ))}
        </section>

        <div className="year-analysis-grid">
          <YearTrajectoryChart />
          <YearKeywordDifferential />
        </div>
      </div>
    </ResearcherShell>
  );
}

function SyncSourceCard({ source }) {
  return (
    <article className="sync-source-card">
      <div className="sync-source-head">
        <div>
          <h2>{source.name}</h2>
          <p>{source.role}</p>
        </div>
        <span className={source.statusTone}>{source.status}</span>
      </div>
      <div className="sync-source-stats">
        <div>
          <span>Synced Records</span>
          <strong>{source.synced}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>{source.latency}</strong>
        </div>
        <div>
          <span>Coverage</span>
          <strong>{source.coverage}</strong>
        </div>
      </div>
    </article>
  );
}

function SyncManagementPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-sync-management"
      current="Sync Management"
      pageClassName="researcher-sync-page"
      mainClassName="researcher-sync-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search sync jobs, APIs, logs..."
    >
      <div className="sync-content">
        <section className="sync-hero">
          <div>
            <span>Dashboard&nbsp; &gt;&nbsp; Sync Management</span>
            <h1>Academic Data Sync Management</h1>
            <p>
              Monitor publication metadata ingestion, API comparison samples,
              normalization, scheduled jobs, and failure logs.
            </p>
          </div>
          <div className="sync-hero-actions">
            <button type="button" className="sync-secondary-button">
              <MiniIcon path="M4 4v6h6M20 20v-6h-6M20 8a7 7 0 0 0-12.1-4M4 16a7 7 0 0 0 12.1 4M9 12h6" />{" "}
              Run Dry Check
            </button>
            <button type="button" className="sync-primary-button">
              <MiniIcon path="M12 5v14M5 12h14M7 7l10 10" /> Start Sync
            </button>
          </div>
        </section>

        <section className="sync-source-grid" aria-label="Sync data sources">
          {syncSourceCards.map((source) => (
            <SyncSourceCard source={source} key={source.name} />
          ))}
        </section>

        <div className="sync-dashboard-grid">
          <section className="sync-panel sync-pipeline-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8" />{" "}
                Metadata Pipeline
              </h2>
              <span>Current batch: #SS-2026-0618</span>
            </div>
            <div className="sync-pipeline-steps">
              {syncPipelineSteps.map((step, index) => (
                <article className={`sync-step ${step.state}`} key={step.label}>
                  <b>{index + 1}</b>
                  <div>
                    <h3>{step.label}</h3>
                    <p>{step.detail}</p>
                  </div>
                  <span>{step.state}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="sync-panel sync-schedule-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6zM9 13h2M13 13h2M9 16h2" />{" "}
                Hangfire Schedule
              </h2>
              <button type="button">Configure</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {syncJobs.map((job) => (
                  <tr key={job.job}>
                    <td>{job.job}</td>
                    <td>{job.schedule}</td>
                    <td>{job.lastRun}</td>
                    <td>{job.duration}</td>
                    <td>
                      <span className={job.status.toLowerCase()}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="sync-panel sync-health-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M12 21s8-4.5 8-11V5l-8-3-8 3v5c0 6.5 8 11 8 11ZM8.5 12l2.2 2.2L15.8 9" />{" "}
                Database Health
              </h2>
            </div>
            <div className="sync-health-grid">
              <div>
                <span>Canonical Publications</span>
                <strong>152,900</strong>
                <i style={{ width: "88%" }}></i>
              </div>
              <div>
                <span>Normalized Authors</span>
                <strong>48,730</strong>
                <i style={{ width: "74%" }}></i>
              </div>
              <div>
                <span>Duplicate Merge Rate</span>
                <strong>3.8%</strong>
                <i style={{ width: "38%" }}></i>
              </div>
              <div>
                <span>Error Queue</span>
                <strong>42</strong>
                <i className="danger" style={{ width: "24%" }}></i>
              </div>
            </div>
          </section>

          <section className="sync-panel sync-log-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5M18 4l2-2M20 6l2-2" />{" "}
                Sync Logs & Errors
              </h2>
              <span>Live logging</span>
            </div>
            <div className="sync-log-list">
              {syncLogs.map((log) => (
                <article
                  className={`sync-log ${log.level.toLowerCase()}`}
                  key={`${log.time}-${log.message}`}
                >
                  <time>{log.time}</time>
                  <strong>{log.level}</strong>
                  <p>{log.message}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </ResearcherShell>
  );
}

function ResearcherSearchTopbar({ onMenuClick }) {
  return (
    <header className="researcher-graph-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-graph-breadcrumb" aria-label="Breadcrumb">
        <a
          href="/researcher-dashboard"
          onClick={navTo("/researcher-dashboard")}
        >
          Dashboard
        </a>
        <span>&gt;</span>
        <strong>Knowledge Graph</strong>
      </nav>

      <form
        className="researcher-graph-search"
        onSubmit={navTo("/researcher-search")}
      >
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
        <input
          type="search"
          defaultValue="DeepFruits: A Fruit Detection System..."
          aria-label="Search knowledge graph"
        />
      </form>

      <div className="researcher-graph-actions">
        <button
          type="button"
          className="graph-toolbar-button"
          onClick={navTo("/researcher-search?view=list")}
        >
          <MiniIcon path="M6 6h12M6 12h12M6 18h12M4 6h.01M4 12h.01M4 18h.01" />
          List View
        </button>
        <button type="button" className="graph-toolbar-button active">
          <MiniIcon path="M4 5h16l-6.2 7.1V18l-3.6 1.6v-7.5L4 5ZM8 8h8" />
          Filters
        </button>
        <button type="button" className="graph-icon-button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM18.5 5.5l1.5-1.5" />
        </button>
        <button
          type="button"
          className="graph-icon-button"
          aria-label="Settings"
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
      </div>
    </header>
  );
}

function ResearcherPublicationTopbar({ onMenuClick }) {
  return (
    <header className="researcher-topbar researcher-publication-topbar">
      <button
        type="button"
        className="researcher-menu-button"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Search
        </a>
        <span>&gt;</span>
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>
          Results
        </a>
        <span>&gt;</span>
        <strong>Deep Learning for Advanced Pattern Recognition...</strong>
      </nav>

      <div className="researcher-top-actions">
        <form
          className="researcher-search"
          onSubmit={navTo("/researcher-search")}
        >
          <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6M8.2 10.5h4.6M10.5 8.2v4.6" />
          <input
            type="search"
            placeholder="Search..."
            aria-label="Search publications"
          />
        </form>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Notifications"
          onClick={navTo("/researcher-notifications")}
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4M17.5 5.5l2-2M6.5 5.5l-2-2" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="Researcher profile"
          />
        </button>
      </div>
    </header>
  );
}

function KnowledgeGraphCanvas({ selectedNodeId, onSelectNode }) {
  const mountRef = React.useRef(null);
  const labelLayerRef = React.useRef(null);
  const graphActionsRef = React.useRef({ zoomIn: null, zoomOut: null });
  const selectionApiRef = React.useRef(null);
  const selectedNodeIdRef = React.useRef(selectedNodeId);

  React.useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
    selectionApiRef.current?.applySelection(selectedNodeId);
  }, [selectedNodeId]);

  React.useEffect(() => {
    const mount = mountRef.current;
    const labelLayer = labelLayerRef.current;
    if (!mount || !labelLayer) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1800);
    camera.position.set(0, 0, 780);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.setAttribute("tabindex", "0");
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.28;
    controls.minDistance = 360;
    controls.maxDistance = 980;
    controls.enablePan = true;

    const graphGroup = new THREE.Group();
    graphGroup.rotation.x = -0.08;
    graphGroup.rotation.y = -0.18;
    graphGroup.position.x = 22;
    graphGroup.position.y = 110;
    graphGroup.scale.setScalar(0.86);
    scene.add(graphGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(160, 220, 340);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.1);
    fillLight.position.set(-260, -120, 220);
    scene.add(fillLight);

    const nodeById = Object.fromEntries(
      graph3DNodes.map((node) => [node.id, node]),
    );
    const labelItems = [];
    const nodeItems = new Map();
    const nodeMeshes = [];

    graph3DLinks.forEach(([sourceId, targetId, tone]) => {
      const source = nodeById[sourceId];
      const target = nodeById[targetId];
      if (!source || !target) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(...source.position),
        new THREE.Vector3(...target.position),
      ]);
      const material = new THREE.LineBasicMaterial({
        color: tone === "strong" ? 0x0f172a : 0xaebfc4,
        transparent: true,
        opacity: tone === "strong" ? 0.34 : 0.12,
      });
      graphGroup.add(new THREE.Line(geometry, material));
    });

    const selectionGroup = new THREE.Group();
    const selectionHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1, 40, 24),
      new THREE.MeshBasicMaterial({
        color: 0xb8cfce,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.055, 16, 120),
      new THREE.MeshBasicMaterial({
        color: 0x9a4a88,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      }),
    );
    selectionGroup.add(selectionHalo, selectionRing);
    selectionGroup.visible = false;
    graphGroup.add(selectionGroup);

    graph3DNodes.forEach((node) => {
      const selectedRadius = node.size;
      const idleRadius = Math.max(node.size * 0.42, 8);
      const radius =
        node.id === selectedNodeIdRef.current ? selectedRadius : idleRadius;
      const position = new THREE.Vector3(...node.position);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: node.id === selectedNodeIdRef.current ? 0.72 : 0.82,
        roughness: 0.48,
        metalness: 0.05,
      });
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 40, 24),
        material,
      );
      sphere.position.copy(position);
      sphere.scale.setScalar(radius);
      sphere.userData.nodeId = node.id;
      graphGroup.add(sphere);
      nodeMeshes.push(sphere);

      const label = document.createElement("span");
      label.className =
        node.id === selectedNodeIdRef.current
          ? "graph-3d-label selected"
          : "graph-3d-label";
      label.textContent = node.label;
      labelLayer.appendChild(label);
      const item = {
        label,
        sphere,
        material,
        node,
        idleRadius,
        selectedRadius,
        currentRadius: radius,
      };
      labelItems.push(item);
      nodeItems.set(node.id, item);
    });

    const applySelection = (nodeId) => {
      const nextNodeId = nodeItems.has(nodeId) ? nodeId : "deepfruits";
      const selectedItem = nodeItems.get(nextNodeId);
      selectedNodeIdRef.current = nextNodeId;

      nodeItems.forEach((item, itemId) => {
        const active = itemId === nextNodeId;
        item.material.opacity = active ? 0.72 : 0.82;
        item.material.emissive.set(active ? 0x6d4df2 : 0x000000);
        item.material.emissiveIntensity = active ? 0.08 : 0;
        item.label.className = active
          ? "graph-3d-label selected"
          : "graph-3d-label";
      });

      if (selectedItem) {
        selectionGroup.visible = true;
        selectionGroup.position.copy(selectedItem.sphere.position);
        selectionGroup.scale.setScalar(selectedItem.currentRadius);
      }
    };

    selectionApiRef.current = { applySelection };
    applySelection(selectedNodeIdRef.current);
    let graphZoom = 0.86;

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 320);
      const isNarrow = width < 620;
      const baseZoom = isNarrow ? 0.78 : 0.86;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = isNarrow ? 1160 : 920;
      graphGroup.position.x = isNarrow ? -46 : 54;
      graphGroup.position.y = isNarrow ? 84 : 92;
      graphZoom = baseZoom;
      graphGroup.scale.setScalar(graphZoom);
      controls.target.set(graphGroup.position.x, graphGroup.position.y, 0);
      controls.minDistance = isNarrow ? 760 : 520;
      controls.maxDistance = isNarrow ? 1420 : 1180;
      camera.updateProjectionMatrix();
      controls.update();
    };

    const setGraphZoom = (nextZoom) => {
      graphZoom = THREE.MathUtils.clamp(nextZoom, 0.62, 1.42);
      graphGroup.scale.setScalar(graphZoom);
      controls.autoRotate = false;
      controls.update();
    };

    graphActionsRef.current.zoomIn = () => setGraphZoom(graphZoom * 1.16);
    graphActionsRef.current.zoomOut = () => setGraphZoom(graphZoom / 1.16);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = null;

    const getIntersectedNodeId = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(nodeMeshes, false)[0]?.object.userData
        .nodeId;
    };

    const handlePointerDown = (event) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      controls.autoRotate = false;
    };

    const handlePointerMove = (event) => {
      renderer.domElement.style.cursor = getIntersectedNodeId(event)
        ? "pointer"
        : "grab";
    };

    const handlePointerUp = (event) => {
      if (!pointerDown) return;
      const moved = Math.hypot(
        event.clientX - pointerDown.x,
        event.clientY - pointerDown.y,
      );
      pointerDown = null;
      if (moved > 7) return;

      const nodeId = getIntersectedNodeId(event);
      if (!nodeId) return;
      applySelection(nodeId);
      onSelectNode?.(nodeId);
    };

    const handlePointerLeave = () => {
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

    const projectedPosition = new THREE.Vector3();
    const worldPosition = new THREE.Vector3();
    let frameId = 0;

    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      controls.update();
      selectionRing.quaternion.copy(camera.quaternion);

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      labelItems.forEach(({ label, sphere, node, currentRadius }) => {
        const isSelected = node.id === selectedNodeIdRef.current;
        sphere.getWorldPosition(worldPosition);
        const offset = currentRadius + (isSelected ? 6 : 13);
        worldPosition.y += offset;
        projectedPosition.copy(worldPosition).project(camera);
        const x = (projectedPosition.x * 0.5 + 0.5) * width;
        const y = (-projectedPosition.y * 0.5 + 0.5) * height;
        const visible = projectedPosition.z < 1;
        const depthScale = THREE.MathUtils.clamp(
          1.08 - projectedPosition.z * 0.22,
          0.72,
          1.08,
        );
        label.style.opacity = visible ? (isSelected ? "1" : "0.86") : "0";
        label.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${depthScale})`;
      });

      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      graphActionsRef.current.zoomIn = null;
      graphActionsRef.current.zoomOut = null;
      selectionApiRef.current = null;
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      renderer.dispose();
      mount.replaceChildren();
      labelLayer.replaceChildren();
    };
  }, [onSelectNode]);

  return (
    <section
      className="knowledge-graph-panel"
      aria-label="Research knowledge graph"
    >
      <div
        className="knowledge-graph-webgl"
        ref={mountRef}
        aria-hidden="true"
      ></div>
      <div
        className="knowledge-graph-label-layer"
        ref={labelLayerRef}
        aria-hidden="true"
      ></div>

      <div className="graph-zoom-controls" aria-label="Zoom controls">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => graphActionsRef.current.zoomIn?.()}
        >
          +
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => graphActionsRef.current.zoomOut?.()}
        >
          -
        </button>
      </div>

      <div className="graph-bottom-bar">
        <button type="button" className="compare-paper-button">
          <MiniIcon path="M12 5v14M5 12h14" />
          Compare New Paper
        </button>
        <label className="year-range-control">
          <span>Year Range</span>
          <em>2010</em>
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2020"
            aria-label="Start year"
          />
          <input
            type="range"
            min="2010"
            max="2024"
            defaultValue="2024"
            aria-label="End year"
          />
          <em>2024</em>
        </label>
      </div>
    </section>
  );
}

function ResearcherPaperPanel({ selectedNode }) {
  const selectedPaper = getGraphPaperForNode(selectedNode);

  return (
    <aside
      className="researcher-paper-panel"
      aria-label="Selected research paper"
    >
      <div className="paper-panel-actions">
        <span>Selected Node</span>
        <div>
          <button type="button" aria-label="Share paper">
            <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
          </button>
          <button
            type="button"
            aria-label="Open paper"
            onClick={navTo("/researcher-publication")}
          >
            <MiniIcon path="M7 7h10v10M7 17 17 7" />
          </button>
        </div>
      </div>

      <h1>
        <a
          href="/researcher-publication"
          onClick={navTo("/researcher-publication")}
        >
          {selectedPaper.title}
        </a>
      </h1>
      <p className="paper-authors">{selectedPaper.authors}</p>
      <div className="paper-meta-row">
        <span>{selectedPaper.year}</span>
        <span>
          <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
          {selectedPaper.venue}
        </span>
      </div>

      <div className="paper-metric-grid">
        <div>
          <span>Similarity Score</span>
          <strong>{selectedPaper.similarity}</strong>
          <MiniIcon path="M12 5v14M5 12h14" />
        </div>
        <div>
          <span>Citations</span>
          <strong>{selectedPaper.citations}</strong>
          <em>99</em>
        </div>
      </div>

      <section className="paper-summary">
        <h2>Abstract Summary</h2>
        <p>{selectedPaper.abstract}</p>
        <a
          href="/researcher-publication"
          onClick={navTo("/researcher-publication")}
        >
          Read full abstract
        </a>
      </section>

      <div className="paper-save-actions">
        <button type="button" className="save-full-text">
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
          Save Full Text
        </button>
        <button type="button" className="save-link-only">
          <MiniIcon path="M10 13a5 5 0 0 1 7.1 0l.9.9a5 5 0 0 1-7.1 7.1l-.9-.9M14 11a5 5 0 0 1-7.1 0L6 10.1A5 5 0 0 1 13.1 3l.9.9" />
          Save Link Only
        </button>
      </div>

      <section className="paper-access-points">
        <h2>Access Points</h2>
        {selectedPaper.accessPoints.map((point, index) => (
          <a
            href="/researcher-search"
            onClick={navTo("/researcher-search")}
            key={point}
          >
            <MiniIcon
              path={
                index === 0
                  ? "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3"
                  : "M12 4 5 19h14L12 4ZM12 9v4M12 16h.01"
              }
            />
            {point}
          </a>
        ))}
      </section>
    </aside>
  );
}

const listViewPapers = [
  {
    id: "deepfruits",
    title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
    authors: "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez",
    year: 2016,
    citations: 986,
    references: 38,
    similarity: 100,
  },
  {
    id: "bell-pepper",
    title: "Automated Bell Pepper Harvesting using Robotic Vision System",
    authors: "Silpa Ajith Kumar, J. S. Kumar",
    year: 2019,
    citations: 0,
    references: 23,
    similarity: 43.5,
    summary:
      "The automation technology used in harvesting the yellow bell pepper makes use of open source computer vision platform to detect the crop amidst the foliage using various image processing techniques and send appropriate signals to move the robot to harvest the crop.",
    tags: ["Computer Vision", "Robotic Harvesting", "Agricultural Automation"],
  },
  {
    id: "fruit-classification",
    title:
      "Automatic Fruits Classification System Based on Deep Neural Networks",
    authors: "Khadija Munir, A. I. Umar, Waqas Yousaf",
    year: 2020,
    citations: 7,
    references: 27,
    similarity: 42,
  },
  {
    id: "cnn-fruit",
    title:
      "Convolutional Neural Networks (CNN) for Detecting Fruit in Orchards",
    authors: "Fouzia Risdin, P. Mondal, Kazi Mahmudul Hassan",
    year: 2020,
    citations: 21,
    references: 28,
    similarity: 41,
  },
  {
    id: "orchard-detection",
    title: "Deep fruit detection in orchards",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 494,
    references: 24,
    similarity: 40.1,
  },
  {
    id: "detsseg",
    title: "DetSSeg: A Selective On-Field Pomegranate Segmentation Method",
    authors: "Shubham S. Mane, Prashant Bartakke, Tulshidas S.",
    year: 2023,
    citations: 2,
    references: 25,
    similarity: 39.3,
  },
  {
    id: "occluded-crop",
    title: "Visual detection of occluded crop: For automated harvesting",
    authors: "C. McCool, Inkyu Sa, Feras Dayoub, Christopher Lehnert",
    year: 2016,
    citations: 77,
    references: 17,
    similarity: 29.2,
  },
  {
    id: "image-segmentation",
    title: "Image Segmentation for Fruit Detection and Yield Estimation",
    authors: "Suchet Bargoti, J. Underwood",
    year: 2016,
    citations: 444,
    references: 56,
    similarity: 26.6,
  },
];

function ResearcherListTopbar({ onMenuClick }) {
  return (
    <header className="researcher-list-topbar">
      <button
        type="button"
        className="researcher-menu-button researcher-list-menu"
        aria-label="Toggle navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      <form
        className="researcher-list-search"
        onSubmit={navTo("/researcher-search?view=list")}
      >
        <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
        <input
          type="search"
          placeholder="Search for a paper, author or concept..."
          aria-label="Search list results"
        />
      </form>

      <nav className="researcher-list-relations" aria-label="Paper relations">
        <button type="button">Prior works</button>
        <button type="button">Derivative works</button>
      </nav>

      <div className="researcher-list-view-toggle" aria-label="Result view">
        <button type="button" className="active">
          <MiniIcon path="M7 7h12M7 12h12M7 17h12M4 7h.01M4 12h.01M4 17h.01" />
          List view
        </button>
        <button type="button" onClick={navTo("/researcher-search")}>
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Graph view
        </button>
      </div>

      <span className="researcher-list-divider" aria-hidden="true"></span>
      <div className="researcher-list-utilities">
        <button type="button" aria-label="Filter results">
          <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
        </button>
        <button type="button" aria-label="Settings">
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <button type="button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </button>
      </div>
    </header>
  );
}

function ResearcherListDetail({ paper }) {
  const [originAdded, setOriginAdded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const summary =
    paper.summary ||
    `This publication explores ${paper.title.toLowerCase()} through a practical computer vision workflow, connecting detection accuracy with reliable deployment in field conditions.`;
  const tags = paper.tags || [
    "Computer Vision",
    "Deep Learning",
    "Fruit Detection",
  ];

  React.useEffect(() => {
    setOriginAdded(false);
    setSaved(false);
  }, [paper.id]);

  return (
    <aside
      className="researcher-list-detail"
      aria-label="Selected paper details"
    >
      <div className="researcher-list-detail-flags">
        <span>Top Similarity</span>
        <span>Highly Cited</span>
        <button type="button" aria-label="More paper actions">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <h2>{paper.title}</h2>
      <p className="researcher-list-detail-authors">{paper.authors}</p>
      <div className="researcher-list-detail-meta">
        <span>{paper.year}</span>
        <span>â€¢</span>
        <span>âŒ {paper.citations} Citations</span>
      </div>

      <div className="researcher-list-primary-actions">
        <button type="button" onClick={navTo("/researcher-search")}>
          <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
          Open graph
        </button>
        <button type="button" onClick={() => setOriginAdded((value) => !value)}>
          <MiniIcon
            path={originAdded ? "M5 12.5 9.5 17 19 7" : "M12 5v14M5 12h14"}
          />
          {originAdded ? "Origin added" : "Add origin"}
        </button>
      </div>

      <button
        type="button"
        className={`researcher-list-save ${saved ? "saved" : ""}`}
        onClick={() => setSaved((value) => !value)}
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        {saved ? "Saved to collection" : "Save to collection"}
      </button>

      <section className="researcher-list-open-in">
        <h3>Open in</h3>
        <div>
          <a href="https://scholar.google.com" target="_blank" rel="noreferrer">
            â–± Google Scholar
          </a>
          <a href="https://doi.org" target="_blank" rel="noreferrer">
            <MiniIcon path="M7 4h8l3 3v13H7zM15 4v4h3M10 12h5M10 15h4" />
            DOI.org
          </a>
        </div>
      </section>

      <section className="researcher-list-tldr">
        <h3>
          <MiniIcon path="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 11h6M9 14h5" />
          S2 TL;DR
        </h3>
        <p>â€œ{summary}â€</p>
      </section>

      <section className="researcher-list-tags">
        <h3>Key metaphors &amp; trends</h3>
        <div>
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>

      <div
        className="researcher-vision-preview"
        aria-label="Vision processing simulation preview"
      >
        <div className="researcher-vision-arm">
          <i></i>
          <i></i>
          <i></i>
        </div>
        <span>Vision Processing Simulation</span>
      </div>
    </aside>
  );
}

function ResearcherListViewPage() {
  const [selectedPaperId, setSelectedPaperId] = React.useState("bell-pepper");
  const selectedPaper =
    listViewPapers.find((paper) => paper.id === selectedPaperId) ||
    listViewPapers[1];

  const downloadResults = () => {
    const rows = [
      ["Title", "Authors", "Year", "Citations", "References", "Similarity"],
      ...listViewPapers.map((paper) => [
        paper.title,
        paper.authors,
        paper.year,
        paper.citations,
        paper.references,
        paper.similarity,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-list-results.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="list"
      pageClassName="researcher-list-view-page"
      mainClassName="researcher-list-shell-main"
    >
      <div className="researcher-list-workspace">
        <section className="researcher-list-results">
          <header className="researcher-list-heading">
            <div>
              <h1>DeepFruits: A Fruit Detection System</h1>
              <p>
                Knowledge Graph <span>â€º</span> <strong>List View</strong>
              </p>
            </div>
            <div>
              <button type="button" onClick={downloadResults}>
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
                Download Results
              </button>
              <button
                type="button"
                aria-label="Close list view"
                onClick={navTo("/researcher-search")}
              >
                <MiniIcon path="M6 6l12 12M18 6 6 18" />
              </button>
            </div>
          </header>

          <div className="researcher-list-table-wrap">
            <table className="researcher-list-table">
              <thead>
                <tr>
                  <th>Title â†•</th>
                  <th>Authors â†•</th>
                  <th>Year â†•</th>
                  <th>Citations â†•</th>
                  <th>References â†•</th>
                  <th>Similarity â†•</th>
                </tr>
              </thead>
              <tbody>
                {listViewPapers.map((paper) => (
                  <tr
                    className={paper.id === selectedPaperId ? "selected" : ""}
                    key={paper.id}
                    onClick={() => setSelectedPaperId(paper.id)}
                  >
                    <td>
                      <button type="button">{paper.title}</button>
                    </td>
                    <td>{paper.authors}</td>
                    <td>{paper.year}</td>
                    <td>{paper.citations}</td>
                    <td>{paper.references}</td>
                    <td>
                      <span className="researcher-list-similarity">
                        <i style={{ width: `${paper.similarity}%` }}></i>
                      </span>
                      <strong>{paper.similarity.toFixed(1)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ResearcherListDetail paper={selectedPaper} />
      </div>
    </ResearcherShell>
  );
}

function ResearcherSearchPage() {
  const view = new URLSearchParams(window.location.search).get("view");
  const [selectedNodeId, setSelectedNodeId] = React.useState("deepfruits");
  const selectedNode = React.useMemo(
    () =>
      graph3DNodes.find((node) => node.id === selectedNodeId) ||
      graph3DNodes[0],
    [selectedNodeId],
  );

  if (view === "list") return <ResearcherListViewPage />;

  return (
    <ResearcherShell
      activeRoute="/researcher-search"
      topbar="graph"
      pageClassName="researcher-search-page"
      mainClassName="researcher-graph-main"
    >
      <div className="researcher-graph-layout">
        <KnowledgeGraphCanvas
          selectedNodeId={selectedNode.id}
          onSelectNode={setSelectedNodeId}
        />
        <ResearcherPaperPanel selectedNode={selectedNode} />
      </div>
    </ResearcherShell>
  );
}

function SearchFilterPanel() {
  return (
    <aside className="search-filter-panel" aria-label="Search filters">
      <div className="search-filter-heading">
        <h2>Filters</h2>
        <button type="button">Clear All</button>
      </div>

      <section className="filter-card">
        <h3>Publication Year</h3>
        <div className="year-range">
          <input type="text" defaultValue="2010" aria-label="From year" />
          <span>-</span>
          <input type="text" defaultValue="2024" aria-label="To year" />
        </div>
      </section>

      <section className="filter-card">
        <h3>Data Source</h3>
        <label>
          <input type="radio" name="source" defaultChecked /> Semantic Scholar
        </label>
        <label>
          <input type="radio" name="source" /> OpenAlex
        </label>
      </section>

      <section className="filter-card">
        <h3>Keywords</h3>
        <div className="keyword-chips">
          <span>
            Machine Learning{" "}
            <button type="button" aria-label="Remove Machine Learning">
              x
            </button>
          </span>
          <span>
            Neural Networks{" "}
            <button type="button" aria-label="Remove Neural Networks">
              x
            </button>
          </span>
          <button type="button">+ Add</button>
        </div>
      </section>
    </aside>
  );
}

function SearchResultCard({ result }) {
  return (
    <article className="search-result-card">
      <button
        className={`result-save ${result.saved ? "saved" : ""}`}
        type="button"
        aria-label="Save publication"
      >
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
      </button>
      <a
        className="result-title-link"
        href="/student-publication"
        onClick={navTo("/student-publication")}
      >
        <h2>{result.title}</h2>
      </a>
      <p className="result-authors">{result.authors}</p>
      <p className="result-abstract">{result.abstract}</p>
      <div className="result-meta-row">
        <div className="result-meta">
          <span>
            <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
            {result.year}
          </span>
          <span>
            <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
            {result.source}
          </span>
          <strong>99 {result.citations} Citations</strong>
        </div>
        <a href="/student-publication" onClick={navTo("/student-publication")}>
          View Source <span aria-hidden="true">-&gt;</span>
        </a>
      </div>
    </article>
  );
}

function StudentSearchPage() {
  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Search Results</strong>
            </div>
          }
          searchValue=""
          wideSearch
        />

        <div className="student-content search-content">
          <h1 className="search-page-title">Publication Search</h1>

          <div className="search-layout">
            <SearchFilterPanel />

            <section
              className="search-results-area"
              aria-label="Publication search results"
            >
              <div className="search-results-toolbar">
                <p>Found 1,248 highly relevant publications</p>
                <label>
                  <span>Sort by:</span>
                  <select defaultValue="Relevance">
                    <option>Relevance</option>
                    <option>Publication Year</option>
                    <option>Citation Count</option>
                  </select>
                </label>
              </div>

              <div className="search-results-list">
                {searchResults.map((result) => (
                  <SearchResultCard result={result} key={result.title} />
                ))}
              </div>

              <div className="pagination-row">
                <p>Showing 1-10 of 1,248 results</p>
                <nav className="pagination" aria-label="Search result pages">
                  <button type="button" aria-label="Previous page">
                    &lt;
                  </button>
                  <button className="active" type="button">
                    1
                  </button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <span>...</span>
                  <button type="button">125</button>
                  <button type="button" aria-label="Next page">
                    &gt;
                  </button>
                </nav>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function BookmarkPaperCard({ paper, detailPath = "/student-publication" }) {
  return (
    <article className="bookmark-paper-card">
      <a href={detailPath} onClick={navTo(detailPath)}>
        <h2>{paper.title}</h2>
      </a>
      <p>{paper.excerpt}</p>
      <div className="bookmark-paper-meta">
        <span>
          <MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />
          {paper.date}
        </span>
        <span>
          <MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" />
          {paper.citations} Citations
        </span>
        <span>
          <MiniIcon path="M4 15.5 9.2 10l3.4 3L20 6.5" />
          Impact: {paper.impact}
        </span>
      </div>
    </article>
  );
}

function BookmarksPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Publications");
  const isResearcher = role === "researcher";
  const detailPath = isResearcher
    ? "/researcher-publication"
    : "/student-publication";
  const dashboardPath = isResearcher
    ? "/researcher-dashboard"
    : "/student-dashboard";

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute="/researcher-bookmarks"
        current="Bookmarks"
        pageClassName="bookmarks-page researcher-bookmarks-page"
        mainClassName="researcher-bookmarks-main"
      >
        <div className="researcher-bookmarks-content bookmarks-content">
          <h1 className="bookmarks-title">Bookmarks &amp; Followed Items</h1>

          <nav className="bookmark-tabs" aria-label="Bookmark categories">
            {bookmarkTabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Publications" && (
            <section
              className="bookmark-paper-list"
              aria-label="Bookmarked publications"
            >
              {bookmarkedPapers.map((paper) => (
                <BookmarkPaperCard
                  paper={paper}
                  detailPath={detailPath}
                  key={paper.title}
                />
              ))}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              {bookmarkedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">
                      {keyword.trend}
                    </span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>
                    View Analytics -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section
              className="bookmark-journal-list"
              aria-label="Bookmarked journals"
            >
              {bookmarkedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      Impact Factor: <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    View Journal -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section
              className="bookmark-topic-list"
              aria-label="Bookmarked topics"
            >
              {bookmarkedTopics.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      Tracked: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    View Topic -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}
        </div>
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app bookmarks-page">
      <StudentSidebar activeRoute="/student-bookmarks" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Bookmarks</strong>
            </div>
          }
          variant="utility"
          searchPlaceholder="Search..."
        />

        <div className="student-content bookmarks-content">
          <h1 className="bookmarks-title">Bookmarks &amp; Followed Items</h1>

          <nav className="bookmark-tabs" aria-label="Bookmark categories">
            {bookmarkTabs.map((tab) => (
              <button
                className={activeTab === tab ? "active" : ""}
                type="button"
                key={tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Publications" && (
            <section
              className="bookmark-paper-list"
              aria-label="Bookmarked publications"
            >
              {bookmarkedPapers.map((paper) => (
                <BookmarkPaperCard
                  paper={paper}
                  detailPath={detailPath}
                  key={paper.title}
                />
              ))}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              {bookmarkedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">
                      {keyword.trend}
                    </span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>
                    View Analytics -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section
              className="bookmark-journal-list"
              aria-label="Bookmarked journals"
            >
              {bookmarkedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      Impact Factor: <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    View Journal -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section
              className="bookmark-topic-list"
              aria-label="Bookmarked topics"
            >
              {bookmarkedTopics.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      Tracked: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    View Topic -&gt;
                  </a>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function NotificationFilterPanel() {
  return (
    <aside className="notification-filters" aria-label="Notification filters">
      {notificationFilters.map((group, groupIndex) => (
        <section
          className={groupIndex > 0 ? "separated" : ""}
          key={`${group.title}-${groupIndex}`}
        >
          {group.title ? <h2>{group.title}</h2> : null}
          <div className="notification-filter-options">
            {group.options.map((option) => (
              <label
                className={option.active ? "active" : ""}
                key={option.label}
              >
                <input
                  type="radio"
                  name={`notification-filter-${groupIndex}`}
                  defaultChecked={option.active}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}

function renderFormattedText(text) {
  if (!text) return "";
  const parts = text.split(/("[^"]*")/g);
  return parts.map((part, index) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return <i key={index}>{part}</i>;
    }
    const subParts = part.split(
      /(Deep Learning|Nature Physics|ArXiv|Semantic Scholar|OpenAlex)/g,
    );
    return subParts.map((subPart, subIndex) => {
      if (
        subPart === "Deep Learning" ||
        subPart === "Nature Physics" ||
        subPart === "ArXiv" ||
        subPart === "Semantic Scholar" ||
        subPart === "OpenAlex"
      ) {
        return (
          <a href="#" className="text-link" key={`${index}-${subIndex}`}>
            {subPart}
          </a>
        );
      }
      return subPart;
    });
  });
}

function NotificationCard({ item }) {
  return (
    <article
      className={`notification-card ${item.tone} ${item.unread ? "unread" : ""}`}
    >
      <div className={`notification-icon ${item.tone}`}>
        <MiniIcon path={item.icon} />
      </div>
      <div className="notification-body">
        <div className="notification-meta">
          <span>{item.type}</span>
          <i aria-hidden="true"></i>
          <span>{item.time}</span>
        </div>
        <p>
          {item.title ? <strong>{item.title} </strong> : null}
          {renderFormattedText(item.text)}
        </p>
      </div>
      {item.unread ? (
        <span
          className="notification-unread-dot"
          aria-label="Unread notification"
        ></span>
      ) : null}
      {item.bookmarked ? (
        <button
          type="button"
          className="notification-bookmark"
          aria-label="Save notification"
        >
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        </button>
      ) : null}
    </article>
  );
}

const extraNotificationItems = [
  {
    type: "NEW PUBLICATION",
    time: "4 days ago",
    title: "NEW RESEARCH:",
    text: 'Dr. Elena Rostova published "Topological Regularization in Deep Autoencoders" in Nature Computational Science.',
    icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3",
    tone: "purple-soft",
    unread: false,
  },
  {
    type: "SYSTEM ALERT",
    time: "5 days ago",
    title: "SYNC COMPLETE:",
    text: "14,200 new publications were successfully synchronized from Semantic Scholar API.",
    icon: "M7 7.5a6 6 0 0 1 10.2-2.8L19 6.5M17 16.5a6 6 0 0 1-10.2 2.8L5 17.5",
    tone: "gray",
    unread: false,
  },
  {
    type: "TREND ALERT",
    time: "1 week ago",
    title: "TREND SPIKE:",
    text: 'Keyword "Single-cell RNA" citation velocity increased by 28% in computational biology journals.',
    icon: "M5 15.5 9.2 11l3.2 2.6L19 7M16 7h3v3",
    tone: "green",
    unread: false,
  },
];

function NotificationsPage({ role = "student" }) {
  const [notifications, setNotifications] = React.useState(notificationItems);
  const [hasMore, setHasMore] = React.useState(true);
  const isResearcher = role === "researcher";

  const handleLoadMore = () => {
    setNotifications((prev) => [...prev, ...extraNotificationItems]);
    setHasMore(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false })),
    );
  };

  const pageContent = (
    <div
      className={
        isResearcher
          ? "researcher-notifications-content notifications-content"
          : "student-content notifications-content"
      }
    >
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on publications, trends, and system alerts.</p>
        </div>
        <button
          type="button"
          className="mark-read-button"
          onClick={handleMarkAllRead}
        >
          <MiniIcon path="M5 12.5 9 16.5 19 6.5" />
          Mark all as read
        </button>
      </div>

      <div className="notifications-layout">
        <NotificationFilterPanel />
        <section className="notification-list" aria-label="Notifications list">
          {notifications.map((item, index) => (
            <NotificationCard
              item={item}
              key={`${item.type}-${item.time}-${index}`}
            />
          ))}
          {hasMore ? (
            <button
              type="button"
              className="load-more-button"
              onClick={handleLoadMore}
            >
              Load More
            </button>
          ) : (
            <div
              className="no-more-notifications"
              style={{
                textAlign: "center",
                color: "#6b7280",
                fontSize: "13px",
                padding: "12px",
                background: "#fff",
                border: "1px dashed #cbd2df",
                borderRadius: "8px",
              }}
            >
              No more notifications
            </div>
          )}
        </section>
      </div>
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute="/researcher-notifications"
        current="Notifications"
        pageClassName="notifications-page researcher-notifications-page"
        mainClassName="researcher-notifications-main"
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app notifications-page">
      <StudentSidebar activeRoute="/student-notifications" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Notifications</strong>
            </div>
          }
          variant="utility"
          searchPlaceholder="Search ScholarTrend..."
        />
        {pageContent}
      </section>
    </main>
  );
}

function ProfileTabs({ activeTab, setActiveTab }) {
  return (
    <nav className="profile-tabs" aria-label="Profile settings">
      {profileTabs.map((tab) => (
        <button
          className={activeTab === tab.label ? "active" : ""}
          type="button"
          key={tab.label}
          onClick={() => setActiveTab(tab.label)}
        >
          <MiniIcon path={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ProfileField({ label, value, readOnly = false, locked = false }) {
  return (
    <label className="profile-field">
      <span>{label}</span>
      <span className={`profile-input ${locked ? "locked" : ""}`}>
        <input type="text" defaultValue={value} readOnly={readOnly} />
        {locked ? (
          <MiniIcon path="M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
        ) : null}
      </span>
    </label>
  );
}

function ProfilePage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Personal Info");
  const [identityConnections, setIdentityConnections] = React.useState({
    orcid: true,
    scholar: false,
    semantic: true,
  });
  const [autoSync, setAutoSync] = React.useState(true);
  const [identityMessage, setIdentityMessage] = React.useState(
    "Academic profile synced 2 hours ago.",
  );
  const isResearcher = role === "researcher";

  const toggleIdentityConnection = (key, label) => {
    setIdentityConnections((current) => {
      const nextValue = !current[key];
      setIdentityMessage(
        nextValue
          ? `${label} connected. ScholarTrend will include it in publication matching.`
          : `${label} disconnected from automatic publication matching.`,
      );
      return { ...current, [key]: nextValue };
    });
  };

  const runIdentitySync = () => {
    setIdentityMessage(
      "Sync queued: ScholarTrend is refreshing author IDs, citations, and topic fingerprints.",
    );
  };

  const pageContent = (
    <div
      className={
        isResearcher
          ? "researcher-profile-content profile-content"
          : "student-content profile-content"
      }
    >
      <h1>User Profile</h1>
      <p className="profile-subtitle">
        Manage your personal information, security, and academic preferences.
      </p>

      <div className="profile-layout">
        <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === "Personal Info" && (
          <section className="profile-card" aria-label="Personal information">
            <div className="profile-card-header">
              <h2>Personal Information</h2>
              <span>Lead Researcher</span>
            </div>

            <div className="profile-photo-row">
              <div className="profile-photo" aria-label="Profile photo">
                <span>A</span>
              </div>
              <div className="profile-upload-actions">
                <div>
                  <button type="button" className="upload-button">
                    Upload New
                  </button>
                  <button type="button" className="remove-button">
                    Remove
                  </button>
                </div>
                <p>JPG, GIF or PNG. Max size of 800K</p>
              </div>
            </div>

            <div className="profile-form-grid">
              <ProfileField label="Full Name" value="Dr. Alexander Scientist" />
              <ProfileField
                label="Email Address (Read-only)"
                value="alexander.s@scholartrend.edu"
                readOnly
                locked
              />
              <ProfileField
                label="Institution"
                value="Institute of Advanced Analytics"
              />
              <ProfileField label="Department" value="Computational Biology" />
            </div>
          </section>
        )}

        {activeTab === "Academic Identity" && (
          <section
            className="profile-card academic-identity-card"
            aria-label="Academic identity"
          >
            <div className="profile-card-header">
              <h2>Academic Identity</h2>
              <span>Publication Sync</span>
            </div>

            <div className="identity-summary-grid">
              <div>
                <span>Verified Author IDs</span>
                <strong>3</strong>
                <em>ORCID, Scholar, Semantic Scholar</em>
              </div>
              <div>
                <span>Matched Publications</span>
                <strong>128</strong>
                <em>+14 this month</em>
              </div>
              <div>
                <span>Citation Footprint</span>
                <strong>4,820</strong>
                <em>98.2% profile confidence</em>
              </div>
            </div>

            <div className="identity-sync-panel">
              <div>
                <h3>Auto-sync author profile</h3>
                <p>
                  Keep publications, citations, and followed research topics
                  aligned with connected academic data sources.
                </p>
              </div>
              <button
                type="button"
                className={
                  autoSync ? "identity-toggle active" : "identity-toggle"
                }
                aria-pressed={autoSync}
                onClick={() => {
                  setAutoSync((enabled) => !enabled);
                  setIdentityMessage(
                    autoSync
                      ? "Auto-sync paused. Manual sync is still available."
                      : "Auto-sync enabled for publication and citation updates.",
                  );
                }}
              >
                <span></span>
                {autoSync ? "Enabled" : "Paused"}
              </button>
            </div>

            <div className="identity-source-list">
              {[
                {
                  key: "orcid",
                  name: "ORCID",
                  detail: "0000-0002-1825-0097",
                  icon: "iD",
                  tone: "green",
                },
                {
                  key: "scholar",
                  name: "Google Scholar",
                  detail: "Import public author profile and citation graph",
                  icon: "GS",
                  tone: "blue",
                },
                {
                  key: "semantic",
                  name: "Semantic Scholar",
                  detail:
                    "Match papers by author ID, DOI, and title similarity",
                  icon: "SS",
                  tone: "purple",
                },
              ].map((source) => (
                <article className="identity-source-card" key={source.key}>
                  <div className={`identity-source-icon ${source.tone}`}>
                    {source.icon}
                  </div>
                  <div>
                    <h3>{source.name}</h3>
                    <p>{source.detail}</p>
                  </div>
                  <button
                    type="button"
                    className={
                      identityConnections[source.key]
                        ? "identity-connect connected"
                        : "identity-connect"
                    }
                    onClick={() =>
                      toggleIdentityConnection(source.key, source.name)
                    }
                  >
                    {identityConnections[source.key] ? "Connected" : "Connect"}
                  </button>
                </article>
              ))}
            </div>

            <div className="identity-action-row">
              <p role="status">{identityMessage}</p>
              <button type="button" onClick={runIdentitySync}>
                <MiniIcon path="M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 11.7 3.2M19 9A7 7 0 0 0 7.3 5.8" />
                Sync Now
              </button>
            </div>
          </section>
        )}

        {activeTab === "Change Password" && (
          <section className="profile-card" aria-label="Change password">
            <div className="profile-card-header">
              <h2>Change Password</h2>
              <span>Security</span>
            </div>
            <div className="profile-form-grid">
              <label className="profile-field" style={{ gridColumn: "span 2" }}>
                <span>Current Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    style={{ maxWidth: "45%" }}
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                </span>
              </label>
              <label className="profile-field">
                <span>Confirm New Password</span>
                <span className="profile-input">
                  <input
                    type="password"
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  />
                </span>
              </label>
            </div>
          </section>
        )}

        {activeTab === "Research Interests" && (
          <section className="profile-card" aria-label="Research interests">
            <div className="profile-card-header">
              <h2>Research Interests</h2>
              <span>Academic Interests</span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#4b5563",
                marginBottom: "20px",
              }}
            >
              Manage the research keywords and topics you follow to customize
              your dashboard feeds and alert notifications.
            </p>
            <div className="keyword-chips" style={{ marginBottom: "20px" }}>
              <span>
                Deep Learning{" "}
                <button
                  type="button"
                  aria-label="Remove Deep Learning"
                  style={{ cursor: "pointer" }}
                >
                  x
                </button>
              </span>
              <span>
                Computational Biology{" "}
                <button
                  type="button"
                  aria-label="Remove Computational Biology"
                  style={{ cursor: "pointer" }}
                >
                  x
                </button>
              </span>
              <span>
                Quantum Computing{" "}
                <button
                  type="button"
                  aria-label="Remove Quantum Computing"
                  style={{ cursor: "pointer" }}
                >
                  x
                </button>
              </span>
              <span>
                Single-cell RNA{" "}
                <button
                  type="button"
                  aria-label="Remove Single-cell RNA"
                  style={{ cursor: "pointer" }}
                >
                  x
                </button>
              </span>
              <button
                type="button"
                style={{ borderStyle: "dashed", cursor: "pointer" }}
              >
                + Add Keyword
              </button>
            </div>
          </section>
        )}

        {activeTab === "Preferences" && (
          <section className="profile-card" aria-label="Preferences">
            <div className="profile-card-header">
              <h2>System Preferences</h2>
              <span>Preferences</span>
            </div>
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Notification Frequency
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Real-time alerts for new publication matches
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Weekly summary email digest
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    System health & sync status alerts
                  </label>
                </div>
              </div>
              <div
                style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}
              >
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    marginBottom: "10px",
                    color: "#111827",
                  }}
                >
                  Default Search Sources
                </h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    Semantic Scholar API
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      fontSize: "13px",
                      color: "#374151",
                    }}
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ width: "16px", height: "16px", margin: 0 }}
                    />{" "}
                    OpenAlex Database
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="profile-action-bar">
        <button type="button" className="profile-cancel">
          Cancel
        </button>
        <button type="button" className="profile-save">
          <MiniIcon path="M5 5h14v14H5zM8 5v5h8V5M8 19v-5h8v5" />
          Save Changes
        </button>
      </div>
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute="/researcher-profile"
        current="Profile"
        pageClassName="profile-page researcher-profile-page"
        mainClassName="researcher-profile-main"
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app profile-page">
      <StudentSidebar activeRoute="/student-profile" />
      <section className="student-main">
        <StudentTopbar
          crumb={
            <div className="topbar-breadcrumb">
              Dashboard <span>&gt;</span> <strong>Profile</strong>
            </div>
          }
          variant="profile"
          searchPlaceholder="Search ScholarTrend..."
        />
        {pageContent}
      </section>
    </main>
  );
}

function ImpactAnalyticsCard() {
  return (
    <aside className="impact-card">
      <h2>Impact Analytics</h2>
      <div className="analytics-block">
        <span>Citation Velocity</span>
        <div className="velocity-row">
          <strong>85</strong>
          <em>^ +12% / mo</em>
        </div>
      </div>
      <div className="analytics-block">
        <span>Field Percentile</span>
        <div className="percentile-bar">
          <i></i>
        </div>
        <strong className="percentile-label">
          Top 2% in Computational Biology
        </strong>
      </div>
      <button type="button" className="track-topic">
        <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        Track this Topic
      </button>
      <div className="analytics-block similarity-match">
        <span>Similarity Match</span>
        <div>
          <strong>85%</strong>
          <p>match to original report</p>
        </div>
      </div>
    </aside>
  );
}

function ExtractedTopicsCard() {
  const topics = [
    "Deep Learning",
    "Single-cell RNA",
    "Manifold Learning",
    "Autoencoders",
    "Biological Trajectories",
  ];

  return (
    <aside className="topics-card">
      <h2>Extracted Topics</h2>
      <div>
        {topics.map((topic) => (
          <span key={topic}>{topic}</span>
        ))}
      </div>
    </aside>
  );
}

function StudentPublicationDetailPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Abstract");
  const isResearcher = role === "researcher";

  const pageContent = (
    <div
      className={`${isResearcher ? "researcher-detail-content" : "student-content"} detail-content`}
    >
      <div className="detail-layout">
        <section className="detail-main-column">
          <article className="publication-detail-hero">
            <div className="detail-hero-actions">
              <span className="article-type">Journal Article</span>
              <div>
                <button type="button" aria-label="Bookmark article">
                  <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                </button>
                <button type="button" aria-label="Share article">
                  <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
                </button>
                <button type="button" className="cite-button">
                  99 Cite
                </button>
              </div>
            </div>

            <h1>
              Deep Learning for Advanced Pattern Recognition in Complex
              Biological Systems
            </h1>
            <p className="detail-authors">
              <strong>Dr. Elena Rostova</strong>, Marcus Thorne, Jin-Soo Park
            </p>
            <p className="detail-journal">
              <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />{" "}
              Nature Computational Science (2023)
            </p>

            <div className="detail-meta-strip">
              <span>
                <MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" /> 1,428
                Citations
              </span>
              <a
                href={
                  isResearcher
                    ? "/researcher-publication"
                    : "/student-publication"
                }
                onClick={navTo(
                  isResearcher
                    ? "/researcher-publication"
                    : "/student-publication",
                )}
              >
                DOI: 10.1038/s43588-023-00123-x -&gt;
              </a>
            </div>
          </article>

          <article className="publication-tabs-card">
            <nav className="detail-tabs" aria-label="Publication metadata tabs">
              {["Abstract", "Keywords", "Authors", "Raw Metadata"].map(
                (tab) => (
                  <button
                    className={activeTab === tab ? "active" : ""}
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ),
              )}
            </nav>

            {activeTab === "Abstract" && (
              <div className="abstract-body">
                <h2>Abstract</h2>
                <p>
                  The integration of deep neural networks into the analysis of
                  multi-omic biological data presents significant challenges due
                  to the high dimensionality and inherent noise of the datasets.
                  In this paper, we introduce a novel manifold learning
                  architecture designed specifically for extracting stable
                  structural features from single-cell RNA sequencing data. By
                  employing a sparse autoencoder with a custom topological
                  regularization term, our model achieves state-of-the-art
                  performance in identifying rare cell populations.
                </p>

                <h3>Key Findings</h3>
                <ul>
                  <li>
                    Novel architecture improves rare cell detection by 24% over
                    baseline models.
                  </li>
                  <li>
                    Topological regularization prevents manifold fragmentation
                    during training.
                  </li>
                  <li>
                    The proposed method scales to datasets exceeding 10 million
                    cells.
                  </li>
                </ul>
              </div>
            )}

            {activeTab === "Keywords" && (
              <div className="abstract-body keywords-tab-body">
                <h2>Keywords</h2>
                <p style={{ marginBottom: "24px" }}>
                  The following semantic concepts were extracted from this
                  publication and cross-referenced with your tracked items.
                </p>
                <div
                  className="keyword-chips-list"
                  style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
                >
                  <span
                    className="keyword-chip-large"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  >
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <strong>Deep Learning</strong>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "12px",
                      }}
                    >
                      (Tracked)
                    </span>
                  </span>
                  <span
                    className="keyword-chip-large"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  >
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <strong>Single-cell RNA</strong>
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "12px",
                      }}
                    >
                      (Tracked)
                    </span>
                  </span>
                  <span
                    className="keyword-chip-large"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  >
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <strong>Manifold Learning</strong>
                  </span>
                  <span
                    className="keyword-chip-large"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  >
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <strong>Autoencoders</strong>
                  </span>
                  <span
                    className="keyword-chip-large"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      padding: "10px 16px",
                      borderRadius: "8px",
                      color: "#ffffff",
                      fontSize: "14px",
                    }}
                  >
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <strong>Biological Trajectories</strong>
                  </span>
                </div>
              </div>
            )}

            {activeTab === "Authors" && (
              <div className="abstract-body authors-tab-body">
                <h2>Authors</h2>
                <div
                  style={{ display: "grid", gap: "20px", marginTop: "24px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "var(--brand)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      ER
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Dr. Elena Rostova
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        Institute of Advanced Analytics Â· Computational Biology
                      </p>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#6366f1",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "6px",
                        }}
                      >
                        ORCID: 0000-0002-1825-0097
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#4f46e5",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      MT
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Marcus Thorne
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        University of Applied Sciences Â· Deep Learning Lab
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      padding: "20px",
                      borderRadius: "12px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        background: "#06b6d4",
                        display: "grid",
                        placeItems: "center",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#ffffff",
                      }}
                    >
                      JP
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#ffffff",
                        }}
                      >
                        Jin-Soo Park
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        Seoul Institute of Technology Â· Bioinformatics Research
                        Division
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Raw Metadata" && (
              <div className="abstract-body metadata-tab-body">
                <h2>Raw Metadata</h2>
                <p style={{ marginBottom: "20px" }}>
                  API metadata payload returned from the indexing data source.
                </p>
                <pre
                  style={{
                    background: "#0b0f19",
                    border: "1px solid #1e293b",
                    padding: "20px",
                    borderRadius: "8px",
                    overflowX: "auto",
                    fontSize: "13px",
                    color: "#a5b4fc",
                    fontFamily: "monospace",
                    lineHeight: "1.5",
                  }}
                >
                  {`{
  "paperId": "10.1038/s43588-023-00123-x",
  "title": "Deep Learning for Advanced Pattern Recognition in Complex Biological Systems",
  "authors": [
    { "name": "Elena Rostova", "orcid": "0000-0002-1825-0097" },
    { "name": "Marcus Thorne" },
    { "name": "Jin-Soo Park" }
  ],
  "journal": {
    "name": "Nature Computational Science",
    "volume": "3",
    "pages": "412-421"
  },
  "citations": 1428,
  "fieldsOfStudy": [
    "Computer Science",
    "Biology",
    "Computational Biology"
  ],
  "indexedDate": "2023-10-15T08:32:00Z"
}`}
                </pre>
              </div>
            )}
          </article>

          <section className="related-section">
            <h2>Related Publications</h2>
            <div className="related-list">
              {relatedPublications.map((paper) => (
                <article className="related-card" key={paper.title}>
                  <div className="related-icon">
                    <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
                  </div>
                  <div>
                    <h3>{paper.title}</h3>
                    <p>
                      {paper.authors} â€¢ {paper.meta}
                    </p>
                    <span>{paper.stats}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="detail-side-column">
          <ImpactAnalyticsCard />
          <ExtractedTopicsCard />
        </section>
      </div>
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute="/researcher-search"
        topbar="publication"
        pageClassName="researcher-publication-page"
        mainClassName="researcher-publication-main"
      >
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar
          crumb="Search  >  Results  >  Deep Learning for Advanced Pattern Recognition..."
          searchValue=""
        />
        {pageContent}
      </section>
    </main>
  );
}

const adminNavItems = [
  {
    label: "Admin Dashboard",
    route: "/admin-dashboard",
    icon: "M4.5 5.5h6v6h-6zM13.5 5.5h6v4h-6zM4.5 14.5h6v4h-6zM13.5 12.5h6v6h-6z",
  },
  {
    label: "Sync Management",
    route: "/admin-sync-management",
    icon: "M7 7h7.5a4.5 4.5 0 0 1 4.2 6.1M17.5 7H14V3.5M17 17H9.5a4.5 4.5 0 0 1-4.2-6.1M6.5 17H10v3.5",
  },
  {
    label: "User Management",
    route: "/admin-user-management",
    icon: "M8.8 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM3.7 19.5a5.2 5.2 0 0 1 10.2 0M16.8 10.5a2.7 2.7 0 1 0 0-5.4M15.7 14.2a4.5 4.5 0 0 1 4.6 4.8",
  },
  {
    label: "System Logs",
    route: "/admin-system-logs",
    icon: "M6 4.5h12v15H6zM9 8h6M9 11.5h6M9 15h3.5M16.5 15h.01",
  },
];

const adminStats = [
  {
    label: "Total Users",
    value: "24,592",
    note: "â†— +12% from last month",
    tone: "users",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M16 15a5 5 0 0 1 5 5",
  },
  {
    label: "Total Publications",
    value: "14.2M+",
    note: "Indexed across repositories",
    tone: "publications",
    icon: "M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4M4 7v14h11",
  },
  {
    label: "Last Sync Status",
    value: "Success",
    note: "2 hours ago",
    tone: "sync",
    icon: "M20 12a8 8 0 1 1-2.34-5.66M8.5 12.5l2.3 2.3L16 9",
  },
  {
    label: "API Health",
    tone: "api",
    icon: "M4 8h5l2 4 2-7 2 7 2-4h3M4 17h16",
    values: [
      ["Semantic Scholar", "99.9%"],
      ["OpenAlex", "98.5%"],
    ],
  },
];

const adminActivity = [
  {
    text: "New user Dr. A. Smith registered.",
    time: "10 mins ago",
    tone: "purple",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M17 7v6M14 10h6",
  },
  {
    text: "OpenAlex delta sync completed.",
    time: "45 mins ago",
    tone: "green",
    icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8",
  },
  {
    text: "Role changed for J. Doe to Lecturer.",
    time: "2 hours ago",
    tone: "blue",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M18 8v7M15 12h6",
  },
  {
    text: "Batch import of 50 students completed.",
    time: "3 hours ago",
    tone: "purple",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M17 7v6M14 10h6",
  },
  {
    text: "Semantic Scholar API rate limit approaching.",
    time: "5 hours ago",
    tone: "red",
    icon: "M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01",
  },
];

function AdminSidebar({ activeRoute, mobileOpen, onClose }) {
  return (
    <aside className={`admin-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="admin-sidebar-brand">
        <span className="admin-brand-mark">
          <MiniIcon path="M5 4h14v16H5zM9 15v-3M12 15V8M15 15v-5M8 18h8" />
        </span>
        <div>
          <strong>ScholarTrend</strong>
          <b>Analytical Intelligence</b>
        </div>
        <button
          type="button"
          aria-label="Close Admin navigation"
          onClick={onClose}
        >
          <MiniIcon path="M6 6l12 12M18 6 6 18" />
        </button>
      </div>

      <nav className="admin-nav" aria-label="Administrator navigation">
        {adminNavItems.map((item) => (
          <a
            className={activeRoute === item.route ? "active" : ""}
            href={item.route}
            onClick={navTo(item.route)}
            key={item.route}
          >
            <MiniIcon path={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <p>
          <i></i> System Status: Healthy
        </p>
        <button type="button">
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
          Settings
        </button>
        <button type="button">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          Support
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar({
  current = "Overview",
  onMenuClick,
  sectionPage = false,
}) {
  return (
    <header
      className={`admin-topbar ${sectionPage ? "admin-section-topbar" : ""}`}
    >
      <button
        type="button"
        className="admin-menu-button"
        aria-label="Open Admin navigation"
        onClick={onMenuClick}
      >
        <MiniIcon path="M4 6h16M4 12h16M4 18h16" />
      </button>
      <h1>
        {sectionPage ? (
          "ScholarTrend Admin"
        ) : (
          <>
            ScholarTrend
            <br />
            Admin
          </>
        )}
      </h1>
      {!sectionPage ? (
        <>
          <nav aria-label="Admin breadcrumb">
            <span>Dashboard</span>
            <b>â€º</b>
            <strong>{current}</strong>
          </nav>
          <form onSubmit={(event) => event.preventDefault()}>
            <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
            <input
              type="search"
              placeholder="Search..."
              aria-label="Search Admin workspace"
            />
          </form>
        </>
      ) : null}
      <div className="admin-top-actions">
        <button
          type="button"
          className="alert"
          aria-label="Admin notifications"
        >
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button type="button" aria-label="Admin settings">
          <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
        </button>
        <span className="admin-mode">
          Admin
          <br />
          Mode
        </span>
        <span className="admin-avatar">AD</span>
      </div>
    </header>
  );
}

function AdminShell({
  activeRoute = "/admin-dashboard",
  current,
  sectionPage = false,
  children,
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const routeClass = activeRoute.replace(/^\//, "").replaceAll("-", "-");

  return (
    <main
      className={`admin-app ${routeClass}-app ${mobileOpen ? "sidebar-mobile-open" : ""}`}
    >
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label="Close Admin navigation"
        onClick={() => setMobileOpen(false)}
      ></button>
      <AdminSidebar
        activeRoute={activeRoute}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <section className="admin-main">
        <AdminTopbar
          current={current}
          sectionPage={sectionPage}
          onMenuClick={() => setMobileOpen(true)}
        />
        {children}
      </section>
    </main>
  );
}

function AdminStatCard({ stat }) {
  return (
    <article className={`admin-stat-card ${stat.tone}`}>
      <div className="admin-stat-heading">
        <span>{stat.label}</span>
        <MiniIcon path={stat.icon} />
      </div>
      {stat.values ? (
        <div className="admin-api-values">
          {stat.values.map(([label, value]) => (
            <p key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </p>
          ))}
        </div>
      ) : (
        <>
          <strong className="admin-stat-value">{stat.value}</strong>
          <p className="admin-stat-note">{stat.note}</p>
          {stat.tone !== "sync" ? <i className="admin-stat-line"></i> : null}
        </>
      )}
    </article>
  );
}

function AdminUserGrowthChart() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return undefined;
    const context = canvasRef.current.getContext("2d");
    const gradient = context.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(79, 70, 229, 0.76)");
    gradient.addColorStop(1, "rgba(139, 131, 232, 0.24)");

    const chart = new Chart(context, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Users",
            data: [9800, 13600, 12400, 17200, 20800, 24592],
            backgroundColor: gradient,
            borderColor: "#6c63e7",
            borderWidth: 1,
            borderRadius: 2,
            borderSkipped: false,
            barPercentage: 0.83,
            categoryPercentage: 0.92,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 700 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#111827",
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (item) =>
                `${new Intl.NumberFormat("en-US").format(item.raw)} users`,
            },
          },
        },
        scales: {
          x: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: "#667085", font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 26000,
            border: { display: false },
            grid: { color: "rgba(148, 163, 184, 0.2)" },
            ticks: {
              stepSize: 5000,
              color: "#667085",
              font: { size: 10 },
              callback: (value) => (value === 0 ? "0" : `${value / 1000}k`),
            },
          },
        },
      },
    });

    return () => chart.destroy();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="User growth over six months"
      role="img"
    ></canvas>
  );
}

function AdminRoleDistributionChart() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return undefined;
    const centerLabel = {
      id: "adminRoleCenterLabel",
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#172033";
        ctx.font = "700 17px Inter, sans-serif";
        ctx.fillText("Total", centerX, centerY - 8);
        ctx.font = "800 13px Inter, sans-serif";
        ctx.fillText("24,592", centerX, centerY + 14);
        ctx.restore();
      },
    };

    const chart = new Chart(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["Researcher", "Student", "Lecturer", "Admin"],
        datasets: [
          {
            data: [45, 30, 20, 5],
            backgroundColor: ["#5145e5", "#45d6aa", "#cfe1fb", "#101827"],
            borderColor: "#ffffff",
            borderWidth: 3,
            hoverOffset: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        rotation: -88,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (item) => `${item.label}: ${item.raw}%` },
          },
        },
      },
      plugins: [centerLabel],
    });

    return () => chart.destroy();
  }, []);

  return (
    <canvas ref={canvasRef} aria-label="Role distribution" role="img"></canvas>
  );
}

function AdminActivityPanel() {
  return (
    <section className="admin-activity-card">
      <h2>Recent System Activity</h2>
      <div>
        {adminActivity.map((activity) => (
          <article key={`${activity.text}-${activity.time}`}>
            <span className={activity.tone}>
              <MiniIcon path={activity.icon} />
            </span>
            <p>
              <strong>{activity.text}</strong>
              <small>{activity.time}</small>
            </p>
          </article>
        ))}
      </div>
      <button type="button" onClick={navTo("/admin-system-logs")}>
        View All Logs
      </button>
    </section>
  );
}

const adminSyncHistory = [
  {
    source: "Semantic Scholar",
    status: "Failed",
    records: "4,102",
    time: "Today, 11:30 AM",
    error: "429 Rate Limit Exceeded",
    detail:
      "The API rejected requests due to high volume. Retry scheduled at next run.",
  },
  {
    source: "Semantic Scholar",
    status: "Completed",
    records: "12,450",
    time: "Today, 10:00 AM",
  },
  {
    source: "OpenAlex",
    status: "Completed",
    records: "3,201",
    time: "Yesterday, 10:00 AM",
  },
  {
    source: "Semantic Scholar",
    status: "Completed",
    records: "11,890",
    time: "Yesterday, 10:00 AM",
  },
];

function AdminSourceToggle({ enabled, onToggle, label, detail }) {
  return (
    <div className="admin-source-toggle">
      <div>
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <button
        type="button"
        className={enabled ? "enabled" : ""}
        role="switch"
        aria-checked={enabled}
        aria-label={`${enabled ? "Disable" : "Enable"} ${label}`}
        onClick={onToggle}
      >
        <i></i>
      </button>
    </div>
  );
}

function AdminSyncConfiguration() {
  const [sources, setSources] = React.useState({
    semantic: true,
    openAlex: false,
  });
  const [keywords, setKeywords] = React.useState(["Machine Learning", "NLP"]);
  const [addingKeyword, setAddingKeyword] = React.useState(false);
  const [newKeyword, setNewKeyword] = React.useState("");
  const [cron, setCron] = React.useState("0 0 * * *");
  const [rateLimit, setRateLimit] = React.useState(120);
  const [saved, setSaved] = React.useState(false);

  const addKeyword = (event) => {
    event.preventDefault();
    const value = newKeyword.trim();
    if (value && !keywords.includes(value))
      setKeywords((items) => [...items, value]);
    setNewKeyword("");
    setAddingKeyword(false);
    setSaved(false);
  };

  return (
    <section className="admin-sync-config-card">
      <h2>
        <MiniIcon path="M6 4v4M6 12v8M12 4v9M12 17v3M18 4v2M18 10v10M4 8h4M10 13h4M16 6h4" />
        Configuration
      </h2>
      <div className="admin-config-body">
        <AdminSourceToggle
          enabled={sources.semantic}
          onToggle={() => {
            setSources((value) => ({ ...value, semantic: !value.semantic }));
            setSaved(false);
          }}
          label="Semantic Scholar"
          detail="Primary Source"
        />
        <AdminSourceToggle
          enabled={sources.openAlex}
          onToggle={() => {
            setSources((value) => ({ ...value, openAlex: !value.openAlex }));
            setSaved(false);
          }}
          label="OpenAlex"
          detail="Secondary Source"
        />

        <div className="admin-config-field admin-keyword-field">
          <label>Keyword Filters</label>
          <div>
            {keywords.map((keyword) => (
              <span key={keyword}>
                {keyword}
                <button
                  type="button"
                  aria-label={`Remove ${keyword}`}
                  onClick={() => {
                    setKeywords((items) =>
                      items.filter((item) => item !== keyword),
                    );
                    setSaved(false);
                  }}
                >
                  Ă—
                </button>
              </span>
            ))}
            {addingKeyword ? (
              <form onSubmit={addKeyword}>
                <input
                  autoFocus
                  value={newKeyword}
                  onChange={(event) => setNewKeyword(event.target.value)}
                  onBlur={() => !newKeyword && setAddingKeyword(false)}
                  aria-label="New keyword"
                />
              </form>
            ) : (
              <button
                type="button"
                className="admin-add-keyword"
                aria-label="Add keyword"
                onClick={() => setAddingKeyword(true)}
              >
                +
              </button>
            )}
          </div>
        </div>

        <div className="admin-config-field admin-cron-field">
          <label htmlFor="admin-cron">Cron Schedule</label>
          <div>
            <input
              id="admin-cron"
              value={cron}
              onChange={(event) => {
                setCron(event.target.value);
                setSaved(false);
              }}
            />
            <span>Daily at midnight</span>
          </div>
        </div>

        <div className="admin-config-field admin-rate-field">
          <label htmlFor="admin-rate">
            Rate Limit (req/min)<strong>{rateLimit}</strong>
          </label>
          <input
            id="admin-rate"
            type="range"
            min="10"
            max="500"
            value={rateLimit}
            onChange={(event) => {
              setRateLimit(Number(event.target.value));
              setSaved(false);
            }}
          />
          <div>
            <span>10</span>
            <span>500</span>
          </div>
        </div>
      </div>
      <div className="admin-config-save">
        <button type="button" onClick={() => setSaved(true)}>
          {saved ? "Configuration Saved" : "Save Configuration"}
        </button>
      </div>
    </section>
  );
}

function AdminSyncHistory() {
  const [failedOnly, setFailedOnly] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const rows = failedOnly
    ? adminSyncHistory.filter((item) => item.status === "Failed")
    : adminSyncHistory;

  const downloadLogs = () => {
    const header = "Source API,Status,Records Synced,Start Time";
    const body = adminSyncHistory
      .map(
        (row) =>
          `${row.source},${row.status},${row.records.replace(",", "")},${row.time}`,
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`${header}\n${body}`], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-sync-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="admin-sync-history-card" id="admin-sync-history">
      <div className="admin-sync-history-heading">
        <h2>
          <MiniIcon path="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v5l3 2" />
          Sync History / Logs
        </h2>
        <div>
          <button
            type="button"
            className={failedOnly ? "active" : ""}
            aria-label="Filter failed logs"
            onClick={() => setFailedOnly((value) => !value)}
          >
            <MiniIcon path="M5 7h14M8 12h8M10 17h4" />
          </button>
          <button
            type="button"
            aria-label="Download sync logs"
            onClick={downloadLogs}
          >
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
          </button>
        </div>
      </div>
      <div className="admin-sync-table-wrap">
        <table className="admin-sync-table">
          <thead>
            <tr>
              <th>Source API</th>
              <th>Status</th>
              <th>Records Synced</th>
              <th>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <React.Fragment key={`${row.source}-${row.time}`}>
                <tr className={row.status.toLowerCase()}>
                  <td>
                    <i></i>
                    {row.source}
                  </td>
                  <td>
                    <span>â™ {row.status}</span>
                  </td>
                  <td>{row.records}</td>
                  <td>{row.time}</td>
                </tr>
                {row.error ? (
                  <tr className="admin-sync-error-row">
                    <td colSpan="4">
                      <div>
                        <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
                        <p>
                          <strong>{row.error}</strong>
                          <span>{row.detail}</span>
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="admin-sync-pagination">
        <span>Showing {rows.length} of 128 runs</span>
        <div>
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            â€¹
          </button>
          {[1, 2, 3].map((number) => (
            <button
              type="button"
              className={page === number ? "active" : ""}
              onClick={() => setPage(number)}
              key={number}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(3, value + 1))}
          >
            â€º
          </button>
        </div>
      </footer>
    </section>
  );
}

function AdminSyncManagementPage() {
  const [running, setRunning] = React.useState(false);

  const reviewLogs = () =>
    document
      .getElementById("admin-sync-history")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <AdminShell
      activeRoute="/admin-sync-management"
      current="Sync Management"
      sectionPage
    >
      <div className="admin-sync-content">
        <header className="admin-sync-page-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>Sync Management</strong>
            </p>
            <h1>Sync Management</h1>
          </div>
          <button
            type="button"
            className={running ? "running" : ""}
            onClick={() => setRunning(true)}
          >
            â–· {running ? "Manual Sync Running" : "Trigger Manual Sync"}
          </button>
        </header>

        <section className="admin-sync-status-grid" aria-label="Sync status">
          <article className="running-card">
            <div>
              <span>Currently Running</span>
              <MiniIcon path="M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8" />
            </div>
            <strong>
              {running ? "1" : "0"}
              <small>jobs</small>
            </strong>
            <p>
              <i className={running ? "active" : ""}></i>
              {running ? "Manual Sync Active" : "System Idle"}
            </p>
          </article>
          <article className="success-card">
            <div>
              <span>Last Successful Sync</span>
              <MiniIcon path="M20 12a8 8 0 1 1-2.34-5.66M8.5 12.5l2.3 2.3L16 9" />
            </div>
            <strong>Today, 10:45 AM</strong>
            <p>12,450 records</p>
            <i className="database-shape"></i>
          </article>
          <article className="failed-card">
            <div>
              <span>Failed in Last 24h</span>
              <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
            </div>
            <strong>
              2<small>events</small>
            </strong>
            <button type="button" onClick={reviewLogs}>
              Review Logs
            </button>
          </article>
        </section>

        <div className="admin-sync-layout">
          <AdminSyncConfiguration />
          <AdminSyncHistory />
        </div>
      </div>
    </AdminShell>
  );
}

function AdminDashboard() {
  const exportUserData = () => {
    const csv =
      "Month,Users\nJan,9800\nFeb,13600\nMar,12400\nApr,17200\nMay,20800\nJun,24592";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-admin-user-growth.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell activeRoute="/admin-dashboard" current="Overview">
      <div className="admin-dashboard-content">
        <section className="admin-stat-grid" aria-label="Administrator metrics">
          {adminStats.map((stat) => (
            <AdminStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="admin-dashboard-grid">
          <div className="admin-dashboard-left">
            <section className="admin-chart-card admin-growth-card">
              <div className="admin-card-heading">
                <h2>User Growth (6 Months)</h2>
                <button type="button" onClick={exportUserData}>
                  Export Data
                </button>
              </div>
              <div className="admin-growth-chart">
                <AdminUserGrowthChart />
              </div>
            </section>

            <section className="admin-chart-card admin-role-card">
              <div className="admin-card-heading">
                <h2>Role Distribution</h2>
              </div>
              <div className="admin-role-layout">
                <div className="admin-role-chart">
                  <AdminRoleDistributionChart />
                </div>
                <div className="admin-role-legend">
                  {[
                    ["Researcher", "45%", "#5145e5"],
                    ["Student", "30%", "#45d6aa"],
                    ["Lecturer", "20%", "#cfe1fb"],
                    ["Admin", "5%", "#101827"],
                  ].map(([label, value, color]) => (
                    <p key={label}>
                      <span>
                        <i style={{ background: color }}></i>
                        {label}
                      </span>
                      <strong>{value}</strong>
                    </p>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <aside className="admin-dashboard-right">
            <section className="admin-sync-alert">
              <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
              <div>
                <h2>Failed Syncs Alert</h2>
                <p>2 sources failed during the last automated cycle.</p>
                <button type="button" onClick={navTo("/admin-system-logs")}>
                  Review Logs
                </button>
              </div>
            </section>
            <AdminActivityPanel />
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

const adminManagedUsers = [
  {
    name: "Elena Smith",
    email: "elena.smith@university.edu",
    role: "Admin",
    status: "Active",
    lastLogin: "2 hrs ago",
    avatar: "ES",
    avatarTone: "blue",
  },
  {
    name: "Dr. Marcus Vance",
    email: "m.vance@institute.org",
    role: "Researcher",
    status: "Active",
    lastLogin: "Oct 12, 2023",
    avatar: "MV",
    avatarTone: "photo",
  },
  {
    name: "Sarah Jenkins",
    email: "s.jenkins@corp.com",
    role: "Viewer",
    status: "Inactive",
    lastLogin: "Sep 05, 2023",
    avatar: "SJ",
    avatarTone: "muted",
  },
  {
    name: "Chen Wei",
    email: "wei.c@scholar.edu",
    role: "Researcher",
    status: "Active",
    lastLogin: "10 mins ago",
    avatar: "CW",
    avatarTone: "green",
  },
];

const adminUserSummary = [
  {
    label: "Total Users",
    value: "12,458",
    note: "+4.2% from last month",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M16 15a5 5 0 0 1 5 5",
  },
  {
    label: "Active Users (30d)",
    value: "8,924",
    note: "+1.8% from last month",
    icon: "M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 7v6M14 10h6M4 20a6 6 0 0 1 10.5-4",
  },
];

function AdminUserManagementPage() {
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("All Roles");
  const [status, setStatus] = React.useState("All Statuses");
  const [page, setPage] = React.useState(1);

  const visibleUsers = adminManagedUsers.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole = role === "All Roles" || user.role === role;
    const matchesStatus = status === "All Statuses" || user.status === status;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const downloadUsers = () => {
    const header = "Name,Email,Role,Status,Last Login";
    const body = visibleUsers
      .map(
        (user) =>
          `${user.name},${user.email},${user.role},${user.status},${user.lastLogin}`,
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`${header}\n${body}`], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-users.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell activeRoute="/admin-user-management" current="User Management">
      <div className="admin-users-content">
        <header className="admin-users-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>User Management</strong>
            </p>
            <h1>User Management</h1>
            <small>Manage system access, roles, and user statuses</small>
          </div>
          <button type="button" className="admin-invite-button">
            <MiniIcon path="M12 5v14M5 12h14M16.5 8.5a3 3 0 1 1 0 6" />
            Invite User
          </button>
        </header>

        <section
          className="admin-users-summary-grid"
          aria-label="User management metrics"
        >
          {adminUserSummary.map((item) => (
            <article className="admin-user-summary-card" key={item.label}>
              <div>
                <span>{item.label}</span>
                <MiniIcon path={item.icon} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
          <article className="admin-user-summary-card admin-key-roles-card">
            <div>
              <span>Key Roles</span>
              <MiniIcon path="M8 7h8M8 11h8M8 15h5M5 4h14v16H5z" />
            </div>
            <p>
              <span>Admin</span>
              <strong>42</strong>
            </p>
            <i className="admin-role-bar admin-role-bar-admin"></i>
            <p>
              <span>Researcher</span>
              <strong>4,180</strong>
            </p>
            <i className="admin-role-bar admin-role-bar-researcher"></i>
          </article>
        </section>

        <section className="admin-users-panel">
          <div className="admin-users-toolbar">
            <label className="admin-users-search">
              <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder="Search name or email..."
                aria-label="Search users by name or email"
              />
            </label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-label="Filter users by role"
            >
              <option>All Roles</option>
              <option>Admin</option>
              <option>Researcher</option>
              <option>Viewer</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter users by status"
            >
              <option>All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <div className="admin-users-toolbar-actions">
              <button
                type="button"
                aria-label="Download users"
                onClick={downloadUsers}
              >
                <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
              </button>
              <button type="button" aria-label="Refresh users">
                <MiniIcon path="M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5" />
              </button>
            </div>
          </div>

          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <span className={`admin-user-avatar ${user.avatarTone}`}>
                        {user.avatar}
                      </span>
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </td>
                    <td>
                      <span className="admin-user-role">{user.role}</span>
                    </td>
                    <td>
                      <span
                        className={`admin-user-status ${user.status.toLowerCase()}`}
                      >
                        <i></i>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>
                      <button type="button" aria-label={`Edit ${user.name}`}>
                        <MiniIcon path="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
                      </button>
                      <button type="button" aria-label={`Delete ${user.name}`}>
                        <MiniIcon path="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="admin-users-pagination">
            <span>Showing 1 to {visibleUsers.length} of 12,458 entries</span>
            <div>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                <MiniIcon path="M15 18l-6-6 6-6" />
              </button>
              {[1, 2, 3].map((number) => (
                <button
                  type="button"
                  className={page === number ? "active" : ""}
                  onClick={() => setPage(number)}
                  key={number}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(3, value + 1))}
              >
                <MiniIcon path="M9 18l6-6-6-6" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </AdminShell>
  );
}

const adminSystemLogSummary = [
  {
    label: "Total Events",
    value: "18,742",
    note: "+326 today",
    tone: "neutral",
    icon: "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5",
  },
  {
    label: "Warnings",
    value: "128",
    note: "14 unresolved",
    tone: "warning",
    icon: "M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01",
  },
  {
    label: "Errors",
    value: "12",
    note: "2 critical",
    tone: "danger",
    icon: "M12 9v4M12 17h.01M5 5l14 14M19 5 5 19",
  },
  {
    label: "Audit Pass Rate",
    value: "99.2%",
    note: "+0.4% from last week",
    tone: "success",
    icon: "M20 12a8 8 0 1 1-2.34-5.66M8.5 12.5l2.3 2.3L16 9",
  },
];

const adminSystemLogs = [
  {
    time: "Today, 11:42 AM",
    event: "Semantic Scholar API rate limit approaching",
    detail: "Retry window scheduled for the next sync cycle.",
    module: "Sync",
    severity: "Warning",
    actor: "scheduler@system",
    code: "SYNC-429",
  },
  {
    time: "Today, 11:18 AM",
    event: "Admin role updated for Elena Smith",
    detail: "Role changed from Researcher to Admin.",
    module: "Users",
    severity: "Info",
    actor: "admin@scholartrend.io",
    code: "USER-204",
  },
  {
    time: "Today, 10:45 AM",
    event: "OpenAlex delta sync completed",
    detail: "3,201 records indexed successfully.",
    module: "Sync",
    severity: "Success",
    actor: "openalex-worker",
    code: "SYNC-200",
  },
  {
    time: "Today, 09:36 AM",
    event: "Failed login threshold exceeded",
    detail: "Account temporarily locked after repeated attempts.",
    module: "Auth",
    severity: "Error",
    actor: "m.vance@institute.org",
    code: "AUTH-403",
  },
  {
    time: "Yesterday, 05:12 PM",
    event: "Publication index rebuilt",
    detail: "Search cache refreshed across active collections.",
    module: "Indexing",
    severity: "Info",
    actor: "indexer@system",
    code: "IDX-118",
  },
];

function AdminSystemLogsPage() {
  const [query, setQuery] = React.useState("");
  const [severity, setSeverity] = React.useState("All Severities");
  const [module, setModule] = React.useState("All Modules");
  const [page, setPage] = React.useState(1);

  const visibleLogs = adminSystemLogs.filter((log) => {
    const matchesQuery = `${log.event} ${log.detail} ${log.actor} ${log.code}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesSeverity =
      severity === "All Severities" || log.severity === severity;
    const matchesModule = module === "All Modules" || log.module === module;
    return matchesQuery && matchesSeverity && matchesModule;
  });

  const exportLogs = () => {
    const header = "Time,Severity,Module,Event,Actor,Code";
    const body = visibleLogs
      .map(
        (log) =>
          `${log.time},${log.severity},${log.module},${log.event},${log.actor},${log.code}`,
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`${header}\n${body}`], { type: "text/csv" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "scholartrend-system-logs.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminShell activeRoute="/admin-system-logs" current="System Logs">
      <div className="admin-logs-content">
        <header className="admin-logs-heading">
          <div>
            <p>
              Dashboard <span>/</span> <strong>System Logs</strong>
            </p>
            <h1>System Logs</h1>
            <small>
              Monitor sync events, access activity, and platform alerts
            </small>
          </div>
          <button
            type="button"
            className="admin-log-export-button"
            onClick={exportLogs}
          >
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            Export Logs
          </button>
        </header>

        <section
          className="admin-logs-summary-grid"
          aria-label="System log metrics"
        >
          {adminSystemLogSummary.map((item) => (
            <article
              className={`admin-log-summary-card ${item.tone}`}
              key={item.label}
            >
              <div>
                <span>{item.label}</span>
                <MiniIcon path={item.icon} />
              </div>
              <strong>{item.value}</strong>
              <p>{item.note}</p>
            </article>
          ))}
        </section>

        <div className="admin-logs-layout">
          <section className="admin-logs-panel">
            <div className="admin-logs-toolbar">
              <label className="admin-logs-search">
                <MiniIcon path="M10.5 16.5a6 6 0 1 1 0-12 6 6 0 0 1 0 12Zm4.4-1.6 4.6 4.6" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Search event, actor, or code..."
                  aria-label="Search system logs"
                />
              </label>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                aria-label="Filter logs by severity"
              >
                <option>All Severities</option>
                <option>Info</option>
                <option>Success</option>
                <option>Warning</option>
                <option>Error</option>
              </select>
              <select
                value={module}
                onChange={(event) => setModule(event.target.value)}
                aria-label="Filter logs by module"
              >
                <option>All Modules</option>
                <option>Auth</option>
                <option>Indexing</option>
                <option>Sync</option>
                <option>Users</option>
              </select>
              <button type="button" aria-label="Refresh logs">
                <MiniIcon path="M20 12a8 8 0 1 1-2.34-5.66M20 5v5h-5" />
              </button>
            </div>

            <div className="admin-logs-table-wrap">
              <table className="admin-logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>Module</th>
                    <th>Severity</th>
                    <th>Actor</th>
                    <th>Code</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLogs.map((log) => (
                    <tr key={`${log.code}-${log.time}`}>
                      <td>{log.time}</td>
                      <td>
                        <strong>{log.event}</strong>
                        <small>{log.detail}</small>
                      </td>
                      <td>
                        <span className="admin-log-module">{log.module}</span>
                      </td>
                      <td>
                        <span
                          className={`admin-log-severity ${log.severity.toLowerCase()}`}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td>{log.actor}</td>
                      <td>
                        <code>{log.code}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="admin-logs-pagination">
              <span>Showing 1 to {visibleLogs.length} of 18,742 events</span>
              <div>
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  <MiniIcon path="M15 18l-6-6 6-6" />
                </button>
                {[1, 2, 3].map((number) => (
                  <button
                    type="button"
                    className={page === number ? "active" : ""}
                    onClick={() => setPage(number)}
                    key={number}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(3, value + 1))}
                >
                  <MiniIcon path="M9 18l6-6-6-6" />
                </button>
              </div>
            </footer>
          </section>

          <aside className="admin-logs-inspector">
            <section>
              <h2>Live Health</h2>
              <p>
                <span>API Gateway</span>
                <strong>Operational</strong>
              </p>
              <p>
                <span>Sync Workers</span>
                <strong>Degraded</strong>
              </p>
              <p>
                <span>Search Index</span>
                <strong>Operational</strong>
              </p>
            </section>
            <section className="admin-log-alert-card">
              <MiniIcon path="M12 4 3.5 20h17L12 4ZM12 9v5M12 17h.01" />
              <div>
                <h2>Attention Needed</h2>
                <p>
                  2 critical events require admin review before the next
                  scheduled sync.
                </p>
                <button type="button">Review Critical</button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

function AdminSectionPage({ activeRoute, title }) {
  return (
    <AdminShell activeRoute={activeRoute} current={title}>
      <div className="admin-placeholder-content">
        <span>Administrator</span>
        <h1>{title}</h1>
        <p>This Admin module is ready for its detailed workflow.</p>
      </div>
    </AdminShell>
  );
}

export default function App() {
  const [, forceRender] = React.useReducer((value) => value + 1, 0);
  const path = window.location.pathname;

  React.useEffect(() => {
    window.addEventListener("scholartrend:navigate", forceRender);
    window.addEventListener("popstate", forceRender);
    return () => {
      window.removeEventListener("scholartrend:navigate", forceRender);
      window.removeEventListener("popstate", forceRender);
    };
  }, []);

  if (path === "/register") return <RegisterPage />;
  if (path === "/login") return <LoginPage />;
  if (path === "/admin-dashboard") return <AdminDashboard />;
  if (path === "/admin-sync-management") return <AdminSyncManagementPage />;
  if (path === "/admin-user-management") return <AdminUserManagementPage />;
  if (path === "/admin-system-logs") return <AdminSystemLogsPage />;
  if (path === "/lecturer-dashboard") return <LecturerDashboard />;
  if (path === "/lecturer-trend-tracking")
    return <TrendTrackingDashboardPage />;
  if (path === "/lecturer-trend-dashboard")
    return <TrendTrackingDashboardPage />;
  if (path === "/lecturer-reports") return <ReportsPage />;
  if (path === "/lecturer-year-comparison") return <YearComparisonPage />;
  if (path === "/lecturer-sync-management") return <SyncManagementPage />;
  if (path === "/lecturer-search") return <ResearcherSearchPage />;
  if (path === "/lecturer-publication")
    return <StudentPublicationDetailPage role="researcher" />;
  if (path === "/lecturer-bookmarks")
    return <BookmarksPage role="researcher" />;
  if (path === "/lecturer-notifications")
    return <NotificationsPage role="researcher" />;
  if (path === "/lecturer-profile") return <ProfilePage role="researcher" />;
  if (path === "/researcher-dashboard") return <ResearcherDashboard />;
  if (path === "/researcher-trend-tracking")
    return <TrendTrackingDashboardPage />;
  if (path === "/researcher-trend-dashboard")
    return <TrendTrackingDashboardPage />;
  if (path === "/researcher-reports") return <ReportsPage />;
  if (path === "/researcher-year-comparison") return <YearComparisonPage />;
  if (path === "/researcher-sync-management") return <SyncManagementPage />;
  if (path === "/researcher-search") return <ResearcherSearchPage />;
  if (path === "/researcher-publication")
    return <StudentPublicationDetailPage role="researcher" />;
  if (path === "/researcher-bookmarks")
    return <BookmarksPage role="researcher" />;
  if (path === "/researcher-notifications")
    return <NotificationsPage role="researcher" />;
  if (path === "/researcher-profile") return <ProfilePage role="researcher" />;
  if (path === "/student-dashboard") return <StudentDashboard />;
  if (path === "/student-search") return <StudentSearchPage />;
  if (path === "/student-bookmarks") return <BookmarksPage />;
  if (path === "/student-notifications") return <NotificationsPage />;
  if (path === "/student-profile") return <ProfilePage />;
  if (path === "/student-publication") return <StudentPublicationDetailPage />;
  return <LandingPage />;
}
