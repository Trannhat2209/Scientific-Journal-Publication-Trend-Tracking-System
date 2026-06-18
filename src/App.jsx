import React from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const navTo = (path) => (event) => {
  event.preventDefault();
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("scholartrend:navigate"));
};

function Brand({ boxed = false, small = false }) {
  return (
    <a className={small ? "footer-brand" : "brand"} href="/" onClick={navTo("/")}>
      <span className={`brand-mark ${boxed ? "boxed" : ""} ${small ? "small" : ""}`} aria-hidden="true">
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
      <span>ScholarTrend{small ? " © 2024" : ""}</span>
    </a>
  );
}

function LandingPage() {
  return (
    <main className="page-shell">
      <header className="site-header" aria-label="Primary navigation">
        <Brand />
        <nav className="nav-actions" aria-label="Account">
          <a className="login-link" href="/login" onClick={navTo("/login")}>Login</a>
          <a className="primary-button compact" href="/register" onClick={navTo("/register")}>Get Started</a>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v5M12 16v5M4.2 12H9M15 12h4.8M6.6 6.6l3.1 3.1M14.3 14.3l3.1 3.1M17.4 6.6l-3.1 3.1M9.7 14.3l-3.1 3.1" />
            </svg>
            Now powered by AI synthesis
          </div>
          <h1>Track the Pulse of Research</h1>
          <p>
            ScholarTrend aggregates, analyzes, and visualizes academic publications from trusted
            scholarly databases to reveal emerging research trends with clarity.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="/register" onClick={navTo("/register")}>Get Started <span aria-hidden="true">-&gt;</span></a>
            <a className="secondary-button" href="/login" onClick={navTo("/login")}>View Demo</a>
          </div>
        </div>

        <div className="hero-visual" aria-label="Research trend analytics dashboard preview">
          <img src="/assets/hero-dashboard.png" alt="Laptop showing publication trend analytics charts" />
        </div>
      </section>

      <section className="source-strip" aria-label="Trusted data sources">
        <span>Trusted data sources</span>
        <a href="/" onClick={navTo("/")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12Z" />
            <path d="M12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
          </svg>
          Semantic Scholar
        </a>
        <a href="/" onClick={navTo("/")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.5 12h17M12 3.5c2.3 2.5 3.4 5.3 3.4 8.5S14.3 18 12 20.5M12 3.5C9.7 6 8.6 8.8 8.6 12S9.7 18 12 20.5" />
          </svg>
          OpenAlex
        </a>
      </section>

      <section className="tools-section" aria-labelledby="tools-title">
        <div className="section-heading">
          <h2 id="tools-title">Precision Tools for Modern Research</h2>
          <p>
            Navigate the complex landscape of global academia with focused, high-density analytics
            for researchers, lecturers, and students.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card search-card">
            <div className="icon-tile">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="4.5" />
                <path d="m14 14 4.5 4.5" />
              </svg>
            </div>
            <h3>Search Publications</h3>
            <p>Instantly query millions of peer-reviewed articles. Our advanced semantic engine understands context, not just keywords, returning the most relevant academic literature instantly.</p>
            <div className="search-preview" aria-hidden="true">
              <div className="preview-search-line"></div>
              <div className="preview-line strong"></div>
              <div className="preview-line"></div>
              <div className="preview-line short"></div>
            </div>
          </article>

          <article className="feature-card insight-card">
            <div className="icon-tile">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                <path d="M10 20h4M8.7 10.2h2.2l1.2-2.2 1.1 4 1-1.8h1.1" />
              </svg>
            </div>
            <h3>AI-Powered Insights</h3>
            <p>Automate literature reviews with our synthesis engine. Instantly extract methodologies, results, and limitations from complex papers.</p>
            <a className="card-link" href="/register" onClick={navTo("/register")}>Explore capabilities <span aria-hidden="true">-&gt;</span></a>
          </article>

          <article className="feature-card trend-card">
            <div className="icon-tile dark">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 15.5 9.2 11l3.2 2.7L19 7.5" />
                <path d="M16 7.5h3v3" />
              </svg>
            </div>
            <h3>Track Global Trends</h3>
            <p>Monitor citation velocity and topic emergence in real-time. Stay ahead of the curve in your specific domain.</p>
            <div className="wave-lines" aria-hidden="true"><span></span><span></span></div>
          </article>

          <article className="feature-card quality-card">
            <div>
              <div className="icon-tile">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.5 14.4 7l4.1.8-2.8 3.1.5 4.2-4.2-1.8-4.2 1.8.5-4.2-2.8-3.1L9.6 7 12 3.5Z" />
                  <path d="m9.4 18.2 2.6 2.3 2.6-2.3" />
                </svg>
              </div>
              <h3>Uncompromising Data Quality</h3>
              <p>We cross-reference every data point against institutional repositories. No hallucinations, just pristine academic facts.</p>
            </div>
            <div className="quality-table" aria-label="Data quality metrics">
              <div><span>Data Point</span><strong>Verified</strong></div>
              <div><span>Citation Accuracy</span><strong>99.9%</strong></div>
              <div><span>Source Transparency</span><strong>100%</strong></div>
            </div>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <Brand small />
        <nav className="footer-links" aria-label="Footer links">
          <a href="/">Privacy Policy</a>
          <a href="/">Terms of Service</a>
          <a href="/">Contact</a>
        </nav>
      </footer>
    </main>
  );
}

function RegisterPage() {
  return (
    <main className="auth-shell" aria-label="Register account">
      <section className="auth-card">
        <div className="auth-form-panel">
          <Brand boxed />
          <div className="auth-heading">
            <h1>Create an Account</h1>
            <p>Join the academic intelligence network.</p>
          </div>

          <form className="register-form">
            <label className="field"><span>Full Name</span><input type="text" placeholder="Dr. Jane Doe" autoComplete="name" /></label>
            <label className="field"><span>Email Address</span><input type="email" placeholder="jane.doe@university.edu" autoComplete="email" /></label>
            <label className="field">
              <span>Primary Role</span>
              <select defaultValue="">
                <option value="" disabled>Select your role</option>
                <option>Researcher</option>
                <option>Lecturer</option>
                <option>Student</option>
                <option>Administrator</option>
              </select>
            </label>
            <label className="field">
              <span>Password</span>
              <span className="password-input">
                <input type="password" defaultValue="Scholar2024" autoComplete="new-password" />
                <button type="button" aria-label="Show password">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                </button>
              </span>
            </label>
            <div className="password-meter" aria-label="Weak password">
              <strong>Weak password</strong>
              <span className="meter-bars" aria-hidden="true"><i className="active"></i><i></i><i></i><i></i></span>
            </div>
            <label className="field"><span>Confirm Password</span><input type="password" defaultValue="Scholar2024" autoComplete="new-password" /></label>
            <label className="terms-check">
              <input type="checkbox" />
              <span>I agree to the <a href="/">Terms &amp; Conditions</a> and <a href="/">Privacy Policy</a>.</span>
            </label>
            <button className="auth-submit" type="submit">Register Account</button>
          </form>

          <p className="auth-switch">Already have an account? <a href="/login" onClick={navTo("/login")}>Login</a></p>
        </div>

        <aside className="auth-visual-panel" aria-label="ScholarTrend discovery preview">
          <div className="orbit-visual" aria-hidden="true">
            <div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="orbit orbit-three"></div>
            <div className="research-plane"></div>
            <div className="spark-field"><span></span><span></span><span></span><span></span><span></span><span></span></div>
          </div>
          <div className="visual-copy">
            <div className="accent-line" aria-hidden="true"></div>
            <div>
              <h2>Accelerate Discovery</h2>
              <p>Join researchers and institutions using analytical intelligence to uncover publication trends and drive scientific progress.</p>
            </div>
          </div>
          <div className="auth-stats">
            <div><span>Publications Tracked</span><strong>14.2M+</strong></div>
            <div><span>Global Institutions</span><strong>8,450</strong></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function LoginPage() {
  return (
    <main className="login-shell" aria-label="Login">
      <section className="login-wrap">
        <div className="login-logo">
          <a href="/" onClick={navTo("/")}>ScholarTrend</a>
          <span>Analytical Intelligence</span>
        </div>

        <form className="login-card" onSubmit={navTo("/researcher-dashboard")}>
          <div className="login-card-bar"></div>
          <h1>Welcome back</h1>
          <p>Please enter your credentials to access your dashboard.</p>

          <label className="field login-field">
            <span>Email Address</span>
            <span className="input-with-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6.5h16v11H4z" />
                <path d="m4.8 7.4 7.2 5.1 7.2-5.1" />
              </svg>
              <input type="email" defaultValue="researcher@university.edu" autoComplete="email" />
            </span>
          </label>

          <label className="field login-field">
            <span>Password</span>
            <span className="input-with-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="6" y="10" width="12" height="9" rx="1.5" />
                <path d="M8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" />
              </svg>
              <input type="password" defaultValue="Scholar2024" autoComplete="current-password" />
            </span>
          </label>

          <div className="login-options">
            <label><input type="checkbox" /> Remember me</label>
            <a href="/">Forgot password?</a>
          </div>

          <button className="login-submit" type="submit">Sign In</button>

          <div className="divider"><span>OR</span></div>

          <div className="login-providers">
            <button type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-6h6v6" />
              </svg>
              Institutional ID
            </button>
            <button type="button">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="6" />
                <path d="M12 8v8M9 12h6" />
              </svg>
              ORCID
            </button>
          </div>
        </form>

        <p className="login-switch">Don't have an account? <a href="/register" onClick={navTo("/register")}>Sign up</a></p>
      </section>
    </main>
  );
}

const sidebarItems = [
  { label: "Dashboard", route: "/student-dashboard", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" },
  { label: "Search", route: "/student-search", icon: "M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" },
  { label: "Bookmarks", route: "/student-bookmarks", icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z" },
  { label: "Notifications", route: "/student-notifications", icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" },
];

const statCards = [
  { label: "My Bookmarks", value: "42", note: "+3 this week", tone: "green", icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z" },
  { label: "Followed Keywords", value: "12", note: "Active", tone: "gray", icon: "M5 7h14M5 12h14M5 17h14" },
  { label: "Unread Alerts", value: "5", note: "Needs review", tone: "gray", icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4", red: true },
  { label: "Recently Viewed", value: "18", note: "Last 7 days", tone: "gray", icon: "M12 7v5l3 2M20 12a8 8 0 1 1-2.35-5.65" },
];

const publications = [
  {
    tags: ["Computer Science", "Peer Reviewed"],
    title: "Neural Network Architectures for Predictive Data Synthesis in High-Noise Environments",
    excerpt:
      "This paper explores novel approaches to structural adjustments within deep learning models when exposed to datasets characterized by extreme signal noise.",
    meta: "Oct 2023  ·  128 Citations  ·  IF: 4.2",
  },
  {
    tags: ["Environmental Science"],
    title: "Longitudinal Analysis of Urban Heat Island Mitigation Strategies in Coastal Metropolises",
    excerpt:
      "A comprehensive ten-year study evaluating the efficacy of green roof implementations and reflective surface treatments across five major coastal cities.",
    meta: "Sep 2023  ·  54 Citations  ·  IF: 3.8",
  },
];

const activities = [
  ["Quantum Cryptography Protocols", "Viewed 2 hours ago", "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z"],
  ["Dataset: Global Emiss...", "Downloaded yesterday", "M12 4v10M8 10l4 4 4-4M5 19h14"],
  ["Sociological Impact of AI", "Bookmarked 3 days ago", "M6 4.5h12v15L12 16l-6 3.5v-15Z"],
  ["Advanced Polymer Synthesis", "Viewed 1 week ago", "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z"],
];

const searchResults = [
  {
    title: "Attention Is All You Need",
    authors: "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin",
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
    title: "Attention Is All You Need: A Retrospective Analysis of Transformer Architectures",
    excerpt:
      "This paper reviews the impact of the original Transformer architecture introduced in 2017, analyzing its adaptations across various domains including natural language processing, computer vision, and computational biology over the last five years.",
    date: "Oct 2023",
    citations: "14,203",
    impact: "High",
  },
  {
    title: "Quantum Supremacy using a Programmable Superconducting Processor",
    excerpt:
      "We report the demonstration of quantum supremacy. We developed a new 54-qubit processor, named \"Sycamore\", that is comprised of fast, high-fidelity quantum logic gates, in order to perform the benchmark testing.",
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
  { name: "Nature Computational Science", impactFactor: "12.3", status: "Active alerts" },
  { name: "Journal of Machine Learning Research", impactFactor: "8.5", status: "Weekly digest" },
  { name: "Bioinformatics", impactFactor: "6.9", status: "Monthly digest" },
];

const bookmarkedTopics = [
  { name: "Manifold Learning", tracked: "32 papers", activity: "High activity" },
  { name: "Predictive Data Synthesis", tracked: "14 papers", activity: "Medium activity" },
  { name: "Neural Network Architectures", tracked: "55 papers", activity: "Low activity" },
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
    text: "A new publication titled \"Advancements in Neural Architecture Search\" matches your interest in Deep Learning. Similarity: 92%.",
    icon: "M12 18v-2M8 10a4 4 0 1 1 8 0c0 2.4-1.4 3.4-2.5 4.3-.8.7-1.5 1.3-1.5 1.7M9.5 19.5h5",
    tone: "purple",
    unread: true,
    bookmarked: true,
  },
  {
    type: "TREND ALERT",
    time: "10 mins ago",
    title: "",
    text: "Keyword \"Transformer Models\" is showing a 34% spike in citations this month across top-tier ML journals.",
    icon: "M5 15.5 9.2 11l3.2 2.6L19 7M16 7h3v3",
    tone: "green",
    unread: true,
  },
  {
    type: "NEW PUBLICATION",
    time: "2 hours ago",
    title: "",
    text: "5 new publications match your followed keyword \"Quantum Computing Scaling\" in Nature Physics.",
    icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3",
    tone: "purple-soft",
    unread: true,
  },
  {
    type: "SYSTEM",
    time: "yesterday",
    title: "",
    text: "Sync management encountered a delay integrating the latest ArXiv dataset. The issue has been resolved.",
    icon: "M7 7.5a6 6 0 0 1 10.2-2.8L19 6.5M17 16.5a6 6 0 0 1-10.2 2.8L5 17.5",
    tone: "gray",
  },
  {
    type: "NEW PUBLICATION",
    time: "3 days ago",
    title: "",
    text: "Dr. E. Thorne, whom you follow, published a new paper: \"Neuroplasticity in Adult Avian Models.\"",
    icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3",
    tone: "purple-soft",
  },
];

const profileTabs = [
  { label: "Personal Info", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0", active: true },
  { label: "Change Password", icon: "M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" },
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
      { label: "Dashboard", route: "/researcher-dashboard", icon: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" },
      { label: "Search", route: "/researcher-search", icon: "M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" },
      { label: "Bookmarks", route: "/researcher-bookmarks", icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z" },
      { label: "Notifications", route: "/researcher-notifications", icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" },
    ],
  },
  {
    heading: "Analysis",
    items: [
      { label: "Trend Tracking", route: "/researcher-trend-tracking", icon: "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" },
      { label: "Reports", route: "/researcher-reports", icon: "M5 5h14v14H5zM8 15V9M12 15v-4M16 15v-7" },
      { label: "Year Comparison", route: "/researcher-year-comparison", icon: "M5 7h4v12H5zM15 5h4v14h-4zM10.5 10h3" },
    ],
  },
  {
    heading: "Lecturer",
    items: [
      { label: "Sync Management", route: "/researcher-sync-management", icon: "M7 7.5a6 6 0 0 1 10.2-2.8L19 6.5M17 16.5a6 6 0 0 1-10.2 2.8L5 17.5" },
    ],
  },
];

const researcherStats = [
  {
    label: "Total Publications",
    value: "124,592",
    note: "+2.4% vs last month",
    tone: "positive",
    icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3",
  },
  {
    label: "New This Week",
    value: "1,843",
    note: "+12% vs last week",
    tone: "positive",
    icon: "M5 7h14M5 12h14M5 17h14",
  },
  {
    label: "Your Bookmarks",
    value: "47",
    note: "3 recently updated",
    tone: "neutral",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Unread Alerts",
    value: "12",
    note: "5 high priority",
    tone: "danger",
    icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
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
    icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3",
    bars: [28, 34, 46, 55, 76],
    tone: "volume",
  },
  {
    label: "YoY Growth",
    value: "+18.4%",
    note: "vs last year",
    icon: "M5 15l4-4 3 3 7-8M16 6h3v3",
    bars: [35, 43, 48, 57, 83],
    tone: "growth",
  },
  {
    label: "Trending Score A",
    sublabel: "(Raw)",
    value: "94.2",
    note: "+1.2",
    icon: "M5 19h14M8 15v-5M12 15V7M16 15v-8",
    score: 94,
    tone: "score-a",
  },
  {
    label: "Trending Score B",
    sublabel: "(Rate)",
    value: "88.7",
    note: "+4.5",
    icon: "M5 12a7 7 0 0 1 13.3-3M18 5v4h-4M19 12a7 7 0 0 1-13.3 3M6 19v-4h4",
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
  { keyword: "Reinforcement Learning", count: "18,320", values: [18, 28, 38, 50, 64] },
];

const trendTopGrowth = [
  { keyword: "Large Language Models", growth: "+850%" },
  { keyword: "Generative AI", growth: "+420%" },
  { keyword: "Prompt Engineering", growth: "+315%" },
  { keyword: "Federated Learning", growth: "+180%" },
  { keyword: "Quantum ML", growth: "+145%" },
];

const trendVolumeRows = [
  { discipline: "Computer Science", values: ["8,400", "10,200", "14,500", "28,000", "42,100"], total: "103,200" },
  { discipline: "Medicine & Health", values: ["1,200", "1,800", "3,100", "6,500", "11,200"], total: "23,800" },
  { discipline: "Engineering", values: ["2,100", "2,500", "3,800", "8,100", "9,400"], total: "25,900" },
  { discipline: "Aggregated Total", values: ["11,700", "14,500", "21,400", "42,600", "62,700"], total: "152,900", summary: true },
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
  { keyword: "Transformers", category: "Artificial Intelligence", mentions: "12,450", change: "+42%", tone: "up" },
  { keyword: "CRISPR-Cas9", category: "Biotechnology", mentions: "8,920", change: "+28%", tone: "up", selected: true },
  { keyword: "LLMs", category: "Artificial Intelligence", mentions: "15,300", change: "+156%", tone: "up" },
  { keyword: "Graphene", category: "Materials Science", mentions: "5,102", change: "-4%", tone: "down" },
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
  { label: "Total Publications", value: "12,450", note: "+8.4%", icon: "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3", bars: [28, 46, 38, 50, 66, 78] },
  { label: "Total Citations", value: "84,201", note: "+12.1%", extra: "99", icon: "M5 19h14M8 16V9M12 16V7M16 16v-5", bars: [24, 36, 29, 43, 58, 70] },
  { label: "Top Keyword Shift", value: "Machine Lear", subvalue: "Stable", icon: "M5 12h12M13 8l4 4-4 4M19 5v14", ranks: ["Rank #1 (2024)", "Rank #1 (2025)"] },
  { label: "Top Journal Divergence", value: "Nature Comm.", subvalue: "2 Rank", icon: "M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3", ranks: ["Rank #2 (2024)", "Rank #4 (2025)"], danger: true },
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
  { label: "Fetch Publication Metadata", detail: "DOI, title, authors, venue, abstract", state: "complete" },
  { label: "Normalize Schema", detail: "Map API fields into ScholarTrend database", state: "active" },
  { label: "Deduplicate Records", detail: "Merge by DOI, Semantic Scholar ID, OpenAlex ID", state: "queued" },
  { label: "Persist to Database", detail: "Write publication, author, keyword relations", state: "queued" },
];

const syncJobs = [
  { job: "Nightly Semantic Scholar Refresh", schedule: "02:00 daily", lastRun: "Today, 02:03", duration: "18m 42s", status: "Succeeded" },
  { job: "OpenAlex RQ2 Sample Compare", schedule: "Saturday", lastRun: "Jun 15, 09:00", duration: "07m 11s", status: "Succeeded" },
  { job: "Metadata Normalization Sweep", schedule: "Every 6 hours", lastRun: "Today, 12:00", duration: "04m 36s", status: "Running" },
];

const syncLogs = [
  { time: "14:21:09", level: "Info", message: "Normalized 1,284 publication records into canonical schema." },
  { time: "14:19:44", level: "Warn", message: "OpenAlex sample returned 18 records without DOI; matched by title similarity." },
  { time: "14:17:02", level: "Error", message: "Semantic Scholar rate limit hit for batch #42. Retry scheduled in 120 seconds." },
  { time: "14:12:18", level: "Info", message: "Hangfire job Metadata Normalization Sweep started." },
];

const graphPaper = {
  title: "DeepFruits: A Fruit Detection System Using Deep Neural Networks",
  authors: "Inkyu Sa, ZongYuan Ge, Feras Dayoub, B. Upcroft, Tristan Perez, C. McCool",
  year: "2016",
  venue: "Sensors Journal",
  similarity: "98.2%",
  citations: "1,429",
  abstract:
    "This paper presents a novel approach to fruit detection using deep convolutional neural networks. The aim is to build an accurate, fast and reliable fruit detection system, which is a vital element of an autonomous agricultural robotic platform.",
  accessPoints: ["PDF via IEEE Xplore", "arXiv:1604.04770"],
};

const graphNodes = [
  { id: "deepfruits", label: "DeepFruits, 2016", x: 360, y: 330, r: 30, selected: true },
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
  { id: "deepfruits", label: "DeepFruits, 2016", position: [130, 10, 24], size: 48, color: "#c3d8d7", selected: true },
  { id: "tarjan1972", label: "Tarjan, 1972", position: [60, 72, 8], size: 70, color: "#b9cecc" },
  { id: "aho1974", label: "Aho, 1974", position: [285, -74, -28], size: 62, color: "#c4d7d6" },
  { id: "hopcroft1974", label: "Hopcroft, 1974", position: [-24, -76, 18], size: 46, color: "#b7cecd" },
  { id: "lipton1977", label: "Lipton, 1977", position: [14, 106, -24], size: 42, color: "#c7d9d9" },
  { id: "gabow2000", label: "Gabow, 2000", position: [-74, 92, 28], size: 36, color: "#608a89" },
  { id: "gabow1976", label: "Gabow, 1976", position: [178, 154, -52], size: 38, color: "#c4d6d5" },
  { id: "frederickson1987", label: "Frederickson, 1987", position: [184, 74, -18], size: 42, color: "#8aa8a8" },
  { id: "williamson1984", label: "Williamson, 1984", position: [-185, 12, 30], size: 38, color: "#b2c9c8" },
  { id: "boyer1976", label: "BoyerEven, 1976", position: [-175, -38, 8], size: 45, color: "#c8d6d4" },
  { id: "fraysseix1985", label: "Fraysseix, 1985", position: [-276, 36, -10], size: 32, color: "#9db8b7" },
  { id: "fraysseix2006a", label: "Fraysseix, 2006", position: [-188, 86, 12], size: 23, color: "#6b9493" },
  { id: "fraysseix2012", label: "Fraysseix, 2012", position: [-230, 120, -42], size: 18, color: "#416f6e" },
  { id: "boyer2003", label: "Boyer, 2003", position: [-236, -24, 48], size: 27, color: "#517b7a" },
  { id: "shih2003", label: "Shih, 2003", position: [-298, -64, 16], size: 25, color: "#6d9998" },
  { id: "shih1999", label: "Shih, 1999", position: [-250, -112, 30], size: 28, color: "#577f7e" },
  { id: "tamassia1986", label: "Tamassia, 1986", position: [-340, -126, -8], size: 39, color: "#91b0af" },
  { id: "tamassia1987", label: "Tamassia, 1987", position: [-346, -244, -34], size: 42, color: "#8fb0af" },
  { id: "feng1995", label: "Feng, 1995", position: [-224, -158, 16], size: 35, color: "#6f9998" },
  { id: "battista1989", label: "Battista, 1989", position: [-166, -220, -16], size: 37, color: "#7fa2a1" },
  { id: "gutwenger2000", label: "Gutwenger, 2000", position: [-116, -148, 42], size: 40, color: "#5d8987" },
  { id: "booth1976", label: "Booth, 1976", position: [-62, -196, -26], size: 52, color: "#bdd2d1" },
  { id: "kuratowski", label: "Kuratowski", position: [-58, -326, -38], size: 50, color: "#9d9d9d" },
  { id: "junger1998", label: "Junger, 1998", position: [-248, -266, -18], size: 36, color: "#5e8887" },
  { id: "nishizeki1988", label: "Nishizeki, 1988", position: [-238, -354, 22], size: 38, color: "#7fa4a3" },
  { id: "korach1988", label: "Korach, 1988", position: [-104, 186, 12], size: 30, color: "#87aaa9" },
  { id: "korach1993", label: "Korach, 1993", position: [-24, 162, -10], size: 22, color: "#85a9a8" },
  { id: "tarjan1986", label: "Tarjan, 1986", position: [-110, 96, 36], size: 32, color: "#b8cfce" },
  { id: "tarjan2022", label: "Tarjan, 2022", position: [-14, 248, 32], size: 24, color: "#426f6f" },
  { id: "hopcroft1972", label: "Hopcroft, 1972", position: [30, 142, -58], size: 31, color: "#cedfdf" },
  { id: "asano1985", label: "Asano, 1985", position: [-18, 30, 62], size: 35, color: "#9db9b8" },
  { id: "colbourn1981", label: "Colbourn, 1981", position: [-22, -38, 42], size: 32, color: "#bed5d4" },
  { id: "grigoreva1991", label: "Grigor'eva, 1991", position: [38, -70, 20], size: 18, color: "#779d9c" },
  { id: "lueker1979", label: "Lueker, 1979", position: [78, -236, -12], size: 36, color: "#b0c8c7" },
  { id: "hopcroft1971", label: "Hopcroft, 1971", position: [164, -228, -50], size: 30, color: "#d5e3e3" },
  { id: "luks1980", label: "Luks, 1980", position: [256, -326, -16], size: 44, color: "#b2cbca" },
  { id: "hopcroft1974b", label: "Hopcroft, 1974", position: [222, -250, 12], size: 34, color: "#c5d8d7" },
];

const graph3DLinks = [
  ["deepfruits", "tarjan1972", "strong"], ["deepfruits", "hopcroft1974", "strong"],
  ["deepfruits", "lipton1977", "strong"], ["deepfruits", "grigoreva1991", "strong"],
  ["deepfruits", "frederickson1987", "strong"], ["deepfruits", "aho1974", "faint"],
  ["tarjan1972", "lipton1977", "strong"], ["tarjan1972", "gabow2000", "strong"],
  ["tarjan1972", "korach1993", "faint"], ["tarjan1972", "tarjan1986", "faint"],
  ["lipton1977", "hopcroft1974", "faint"], ["hopcroft1974", "colbourn1981", "strong"],
  ["hopcroft1974", "booth1976", "faint"], ["hopcroft1974", "lueker1979", "strong"],
  ["lueker1979", "luks1980", "strong"], ["lueker1979", "hopcroft1971", "faint"],
  ["luks1980", "hopcroft1974b", "strong"], ["gabow2000", "gabow1976", "faint"],
  ["gabow2000", "hopcroft1972", "faint"], ["frederickson1987", "gabow1976", "faint"],
  ["williamson1984", "boyer1976", "strong"], ["williamson1984", "fraysseix1985", "strong"],
  ["williamson1984", "fraysseix2006a", "faint"], ["boyer1976", "boyer2003", "strong"],
  ["boyer1976", "feng1995", "faint"], ["boyer1976", "gutwenger2000", "faint"],
  ["fraysseix1985", "fraysseix2012", "faint"], ["fraysseix1985", "shih2003", "strong"],
  ["fraysseix1985", "boyer2003", "faint"], ["fraysseix2006a", "fraysseix2012", "strong"],
  ["shih2003", "shih1999", "strong"], ["shih1999", "tamassia1986", "faint"],
  ["tamassia1986", "tamassia1987", "strong"], ["tamassia1986", "feng1995", "faint"],
  ["feng1995", "battista1989", "faint"], ["feng1995", "junger1998", "strong"],
  ["battista1989", "gutwenger2000", "strong"], ["junger1998", "nishizeki1988", "faint"],
  ["gutwenger2000", "booth1976", "strong"], ["booth1976", "kuratowski", "faint"],
  ["korach1988", "korach1993", "strong"], ["korach1988", "tarjan1986", "strong"],
  ["korach1993", "tarjan2022", "faint"], ["tarjan1986", "asano1985", "faint"],
  ["asano1985", "colbourn1981", "strong"], ["colbourn1981", "booth1976", "faint"],
  ["asano1985", "williamson1984", "faint"], ["tarjan1986", "boyer1976", "faint"],
  ["gabow2000", "williamson1984", "faint"], ["colbourn1981", "lueker1979", "faint"],
  ["fraysseix1985", "korach1988", "faint"], ["boyer1976", "tarjan1986", "faint"],
  ["williamson1984", "asano1985", "faint"], ["gutwenger2000", "hopcroft1974", "faint"],
];

const getGraphPaperForNode = (node) => {
  if (!node || node.id === "deepfruits") return graphPaper;

  const [name, rawYear] = node.label.split(", ");
  const year = rawYear || "Network";
  const citationCount = Math.round(
    node.size * 27 + Math.abs(node.position[0]) * 1.8 + Math.abs(node.position[1]) + 180
  );
  const similarity = Math.min(97.6, 82.5 + node.size * 0.18).toFixed(1);

  return {
    title: `${node.label}: Citation Neighborhood`,
    authors: `${name} and related indexed publications`,
    year,
    venue: "ScholarTrend Knowledge Graph",
    similarity: `${similarity}%`,
    citations: citationCount.toLocaleString("en-US"),
    abstract:
      `${node.label} sits inside a connected citation neighborhood. ScholarTrend ranks this node by graph proximity, citation overlap, and topical similarity to the selected research query.`,
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
        <a href="/" onClick={navTo("/")}>ScholarTrend</a>
        <span>Analytical Intelligence</span>
      </div>

      <nav className="student-nav" aria-label="Student dashboard navigation">
        {sidebarItems.map((item) => (
          <a className={item.route === activeRoute ? "active" : ""} href={item.route} onClick={navTo(item.route)} key={item.label}>
            <MiniIcon path={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="student-sidebar-footer">
        <a className={`sidebar-profile-card ${activeRoute === "/student-profile" ? "active" : ""}`} href="/student-profile" onClick={navTo("/student-profile")}>
          <div className="sidebar-avatar">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar" />
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

function StudentTopbar({ crumb = "Dashboard", searchValue = "", wideSearch = false, variant = "default", searchPlaceholder = "Search keyword, author, or DOI..." }) {
  const isProfileUtility = variant === "profile";
  const isUtility = variant === "utility" || isProfileUtility;

  return (
    <header className={`student-topbar ${isUtility ? "utility" : ""} ${isProfileUtility ? "profile-utility" : ""}`}>
      {crumb ? (typeof crumb === "string" ? <span>{crumb}</span> : crumb) : null}
      <div className="student-top-actions">
        <form className={`student-global-search ${wideSearch ? "wide" : ""}`} onSubmit={navTo("/student-search")}>
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input type="search" placeholder={searchPlaceholder} defaultValue={searchValue} />
        </form>
        <div className="topbar-icon-group">
          <button type="button" aria-label={isUtility ? "Help" : "Notifications"} className={`top-icon ${isUtility ? "" : "alert-dot"}`}>
            <MiniIcon path={isUtility ? "M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" : "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4"} />
          </button>
          <button type="button" aria-label="Settings" className="top-icon">
            <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
          </button>
          <button type="button" aria-label="User profile" className="student-avatar image-avatar">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User profile" />
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
              <p><span>Student</span> University of Applied Sciences</p>
            </div>
            <button type="button" className="new-project">+ New Project</button>
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
            <p>Search across millions of academic papers, journals, and analytical reports.</p>
            <form onSubmit={navTo("/student-search")}>
              <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
              <input type="search" placeholder="Search by title, author, DOI, or keyword..." />
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
                  <button type="button" aria-label="Bookmark publication" className="bookmark-button">
                    <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                  </button>
                  <div className="publication-tags">
                    {paper.tags.map((tag) => <span key={tag}>{tag}</span>)}
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
                  <a className="activity-item" href="/student-publication" onClick={navTo("/student-publication")} key={title}>
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

function ResearcherSidebar({ activeRoute = "/researcher-dashboard", collapsed = false, mobileOpen = false, onClose, onToggleCollapse }) {
  return (
    <aside className={`researcher-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="researcher-logo">
        <a href="/" onClick={navTo("/")}>ScholarTrend</a>
        <span>Analytical Intelligence</span>
        <button type="button" className="researcher-sidebar-close" aria-label="Close navigation" onClick={onClose}>
          <MiniIcon path="M6 6l12 12M18 6 6 18" />
        </button>
        <button type="button" className="researcher-sidebar-toggle" aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} onClick={onToggleCollapse}>
          <MiniIcon path={collapsed ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
        </button>
      </div>

      <nav className="researcher-nav" aria-label="Researcher dashboard navigation">
        {researcherNavGroups.map((group, groupIndex) => (
          <div className="researcher-nav-group" key={group.heading || `primary-${groupIndex}`}>
            {group.heading ? <h2>{group.heading}</h2> : null}
            {group.items.map((item) => (
              <a
                className={item.route === activeRoute && (activeRoute !== "/researcher-dashboard" || item.label === "Dashboard") ? "active" : ""}
                href={item.route}
                onClick={navTo(item.route)}
                key={`${group.heading || "primary"}-${item.label}`}
              >
                <MiniIcon path={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
          </div>
        ))}
      </nav>

      <div className="researcher-sidebar-footer">
        <button type="button" className="researcher-upgrade">Upgrade to Pro</button>
        <div className="researcher-footer-actions">
          <a href="/researcher-profile" onClick={navTo("/researcher-profile")} aria-label="Profile">
            <MiniIcon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />
          </a>
          <button type="button" aria-label="Settings">
            <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
          </button>
        </div>
      </div>
    </aside>
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

function ResearcherTopbar({ current = "Dashboard", onMenuClick, rootLabel = "ScholarTrend", rootPath = "/", searchPlaceholder = "Search publications, authors, keywords..." }) {
  return (
    <header className="researcher-topbar">
      <button type="button" className="researcher-menu-button" aria-label="Toggle navigation" onClick={onMenuClick}>
        <MiniIcon path="M4 6h16M4 12h16M4 18h16" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href={rootPath} onClick={navTo(rootPath)}>{rootLabel}</a>
        <span>&gt;</span>
        <strong>{current}</strong>
      </nav>

      <div className="researcher-top-actions">
        <form className="researcher-search" onSubmit={navTo("/researcher-search")}>
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input type="search" placeholder={searchPlaceholder} />
        </form>
        <button type="button" className="researcher-top-icon alert-dot" aria-label="Notifications" onClick={navTo("/researcher-notifications")}>
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button type="button" className="researcher-top-icon" aria-label="Settings">
          <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
        </button>
        <button type="button" className="researcher-avatar" aria-label="User profile" onClick={navTo("/researcher-profile")}>
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Researcher profile" />
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
  const TopbarComponent = topbar === "graph" ? (
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
    <main className={`researcher-app ${pageClassName} ${sidebar.collapsed ? "sidebar-collapsed" : ""} ${sidebar.mobileOpen ? "sidebar-mobile-open" : ""}`}>
      <button type="button" className="researcher-sidebar-backdrop" aria-label="Close navigation" onClick={sidebar.closeMobile}></button>
      <ResearcherSidebar
        activeRoute={activeRoute}
        collapsed={sidebar.collapsed}
        mobileOpen={sidebar.mobileOpen}
        onClose={sidebar.closeMobile}
        onToggleCollapse={sidebar.toggleCollapse}
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
  const [activeIndex, setActiveIndex] = React.useState(publicationGrowthData.length - 1);
  const chartWidth = 720;
  const chartHeight = 430;
  const padding = { top: 28, right: 34, bottom: 54, left: 68 };
  const maxValue = 100000;
  const yTicks = [0, 25000, 50000, 75000, 100000];
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const bottom = chartHeight - padding.bottom;
  const formatCount = (value) => (value === 0 ? "0" : `${Math.round(value / 1000)}k`);
  const formatFullCount = (value) => new Intl.NumberFormat("en-US").format(value);
  const getX = (index) => padding.left + (index / (publicationGrowthData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = publicationGrowthData.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.publications),
  }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  const activePoint = points[activeIndex];
  const previousPoint = points[activeIndex - 1];
  const activeDelta = previousPoint
    ? ((activePoint.publications - previousPoint.publications) / previousPoint.publications) * 100
    : 0;
  const latestPoint = points[points.length - 1];
  const previousYear = points[points.length - 2];
  const yearlyGrowth = ((latestPoint.publications - previousYear.publications) / previousYear.publications) * 100;
  const tooltipTransform =
    activePoint.x < 130
      ? "translate(0, -112%)"
      : activePoint.x > chartWidth - 130
        ? "translate(-100%, -112%)"
        : "translate(-50%, -112%)";

  return (
    <section className="researcher-chart-card" aria-label="Publication growth over time">
      <div className="researcher-card-heading">
        <div>
          <h2>Publication Growth Over Time</h2>
          <p>10-year trend analysis across indexed databases</p>
        </div>
        <button type="button" aria-label="Chart options">
          <MiniIcon path="M12 5.5h.01M12 12h.01M12 18.5h.01" />
        </button>
      </div>

      <div className="chart-summary" aria-label="Current publication growth summary">
        <span><strong>{formatFullCount(latestPoint.publications)}</strong> publications in {latestPoint.year}</span>
        <span className={yearlyGrowth >= 0 ? "positive" : "danger"}>{yearlyGrowth >= 0 ? "+" : ""}{yearlyGrowth.toFixed(1)}% YoY</span>
      </div>

      <div className="growth-chart">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-labelledby="growthChartTitle">
          <title id="growthChartTitle">Publication growth chart from 2014 to 2024 based on yearly publication counts.</title>
          <defs>
            <linearGradient id="growthArea" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className="chart-grid">
            {yTicks.map((tick) => (
              <path key={tick} d={`M${padding.left} ${getY(tick)}H${chartWidth - padding.right}`} />
            ))}
          </g>
          <path className="chart-axis-line" d={`M${padding.left} ${bottom}H${chartWidth - padding.right}`} />
          <g className="chart-axis-labels y-labels">
            {yTicks.map((tick) => (
              <text key={tick} x={padding.left - 18} y={getY(tick) + 4} textAnchor="end">{formatCount(tick)}</text>
            ))}
          </g>
          <g className="chart-axis-labels x-labels">
            {points.map((point, index) => (
              index % 2 === 0 || index === points.length - 1 ? (
                <text key={point.year} x={point.x} y={chartHeight - 18} textAnchor="middle">{point.year}</text>
              ) : null
            ))}
          </g>

          <path className="chart-area" d={areaPath} />
          <path className="chart-line" d={linePath} />
          <path className="chart-active-line" d={`M${activePoint.x} ${padding.top}V${bottom}`} />

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
              <circle className="chart-hit-area" cx={point.x} cy={point.y} r="16" />
              <circle className="chart-point" cx={point.x} cy={point.y} r={index === activeIndex ? "5" : "4"} />
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
            {previousPoint ? `${activeDelta >= 0 ? "+" : ""}${activeDelta.toFixed(1)}% vs previous year` : "Baseline year"}
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
      <div className="domain-donut" aria-label="Medicine 40%, Engineering 30%, Biology 20%">
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

        <button type="button" className="researcher-download" aria-label="Download report">
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
            <i style={{ height: `${height}%` }} key={`${card.label}-${index}`}></i>
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
    <section className="trend-keywords-overview" aria-label="Top keywords overview">
      <div className="trend-overview-heading">
        <div>
          <span>Dashboard&nbsp; &gt;&nbsp; Trending Keywords</span>
          <h2>Top Keywords Overview</h2>
        </div>
        <div className="trend-sort-toggle" aria-label="Keyword ranking strategy">
          <button type="button" className="active">By Count</button>
          <button type="button">By Growth</button>
        </div>
      </div>

      <div className="trend-topic-filters" aria-label="Topic filters">
        {trendTopicFilters.map((filter, index) => (
          <button type="button" className={index === 0 ? "active" : ""} key={filter}>{filter}</button>
        ))}
      </div>

      <div className="trend-keyword-card-grid">
        {trendKeywordOverview.map((keyword) => (
          <article className={`trend-keyword-card ${keyword.selected ? "selected" : ""}`} key={keyword.keyword}>
            <div className="trend-keyword-topline">
              <div>
                <h3>{keyword.keyword}</h3>
                <span>{keyword.category}</span>
              </div>
              <button
                type="button"
                aria-label={keyword.selected ? `Selected ${keyword.keyword}` : `Add ${keyword.keyword}`}
                onClick={navTo("/researcher-trend-dashboard")}
              >
                {keyword.selected ? <MiniIcon path="M5 12.5 9.2 16.5 19 7" /> : "+"}
              </button>
            </div>
            <div className="trend-keyword-bottomline">
              <div>
                <strong>{keyword.mentions}</strong>
                <span>Mentions</span>
              </div>
              <em className={keyword.tone}>
                {keyword.tone === "up" ? <MiniIcon path="M12 19V5M7 10l5-5 5 5" /> : <MiniIcon path="M12 5v14M7 14l5 5 5-5" />}
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
  const getX = (index) => padding.left + (index / (trendLineData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - (value - minValue) / (maxValue - minValue)) * plotHeight;
  const points = trendLineData.map((item, index) => ({ ...item, x: getX(index), y: getY(item.value) }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const ghostPath = `M ${points[2].x} ${points[2].y} L ${points[3].x} ${getY(56000)} L ${points[4].x} ${getY(66000)}`;

  return (
    <section className="trend-panel trend-chart-panel" aria-label="Publication trend over time">
      <div className="trend-tabs">
        <button type="button" className="active">Publications Over Time</button>
        <button type="button">Distribution by Journal</button>
      </div>
      <div className="trend-chart-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Publications over time from 2019 to 2023">
          <g className="trend-grid">
            {[0, 1, 2, 3].map((tick) => (
              <path key={tick} d={`M${padding.left} ${padding.top + tick * (plotHeight / 3)}H${width - padding.right}`} />
            ))}
          </g>
          <path className="trend-axis" d={`M${padding.left} ${height - padding.bottom}H${width - padding.right}`} />
          <path className="trend-axis" d={`M${padding.left} ${padding.top}V${height - padding.bottom}`} />
          <path className="trend-line-primary" d={path} />
          <path className="trend-line-secondary" d={ghostPath} />
          {points.map((point) => (
            <g key={point.year}>
              <circle className="trend-point" cx={point.x} cy={point.y} r="4.5" />
              <text x={point.x} y={height - 9} textAnchor="middle">{point.year}</text>
            </g>
          ))}
          <circle className="trend-point emphasis" cx={points[4].x - 30} cy={getY(56000)} r="4.5" />
          <circle className="trend-point emphasis" cx={points[4].x} cy={getY(62700)} r="4.5" />
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
          <h2><MiniIcon path="M5 7h14M5 12h14M5 17h14" /> Top 10 by Raw Count (Strategy A)</h2>
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
                <td><TrendSparkline values={row.values} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2><MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" /> Top 10 by Growth Rate (Strategy B)</h2>
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
                <td><MiniIcon path="M12 19V5M7 10l5-5 5 5" /></td>
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
                {row.values.map((value, index) => <td key={`${row.discipline}-${index}`}>{value}</td>)}
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
            <p>Analyze keyword velocity and raw publication volume across disciplines.</p>
          </div>
          <form className="trend-filter-panel" onSubmit={navTo("/researcher-trend-dashboard")}>
            <label className="trend-keyword-field">
              <MiniIcon path="M6 5h12M8 12h8M10 19h4" />
              <input type="search" defaultValue="Machine Learning" aria-label="Trend keyword" />
              <button type="button" aria-label="Clear keyword">x</button>
            </label>
            <div className="trend-filter-row">
              <label>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6z" />
                <select defaultValue="Last 5 Years (2019-2023)" aria-label="Date range">
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
          {trendMetricCards.map((card) => <TrendMetricCard card={card} key={card.label} />)}
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
      <h2><MiniIcon path={icon} /> Step {step}: {title}</h2>
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
            <ReportStepCard step="1" title="Select Scope" icon="M4 5h16l-6 7v5l-4 2v-7L4 5Z">
              <label className="report-field">
                <span>Keywords (Multi-select)</span>
                <div className="report-token-box">
                  <span>machine learning <button type="button">x</button></span>
                  <span>climate models <button type="button">x</button></span>
                  <input type="text" placeholder="Type and press enter..." />
                </div>
              </label>
              <label className="report-field">
                <span>Journals (Multi-select)</span>
                <div className="report-empty-select"></div>
              </label>
              <div className="report-year-grid">
                <label className="report-field"><span>Start Year</span><input type="text" defaultValue="2018" /></label>
                <label className="report-field"><span>End Year</span><input type="text" defaultValue="2023" /></label>
              </div>
              <label className="report-field">
                <span>Topics</span>
                <input type="text" defaultValue="e.g. Artificial Intelligence, Genomics" />
              </label>
            </ReportStepCard>

            <ReportStepCard step="2" title="Choose Metrics" icon="M5 5h14v14H5zM8 15V9M12 15v-4M16 15v-7">
              <div className="report-metric-options">
                {reportMetrics.map((metric, index) => (
                  <label key={metric}>
                    <input type="checkbox" defaultChecked={index !== 3 && index !== 5} />
                    <span>{metric}</span>
                  </label>
                ))}
              </div>
            </ReportStepCard>

            <ReportStepCard step="4" title="Export Options" icon="M12 4v10M8 10l4 4 4-4M5 19h14" accent>
              <div className="report-format-options">
                <label><input type="radio" name="format" defaultChecked /> <span>Excel (.xlsx)</span></label>
                <label><input type="radio" name="format" /> <span>CSV</span></label>
              </div>
              <label className="report-switch">
                <input type="checkbox" defaultChecked />
                <span>Include raw data sheets</span>
              </label>
              <button type="button" className="report-generate-button">
                <MiniIcon path="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />
                Generate Report
              </button>
            </ReportStepCard>
          </aside>

          <section className="reports-preview-column">
            <section className="report-preview-card">
              <div className="report-panel-heading">
                <h2><MiniIcon path="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12Z" /> Step 3: Live Preview</h2>
                <button type="button">Sample Data</button>
              </div>
              <div className="report-document-preview">
                <h3>Trend Analysis: Machine Learning in Nature &amp; Science (2018-2023)</h3>
                <p>Generated on: [Current Date] • Scope: 2 Keywords, 2 Journals</p>
                <div className="report-preview-metrics">
                  <div><span>Total Publications</span><strong>1,245</strong><i></i></div>
                  <div><span>Avg Growth Rate</span><strong>+14.2%</strong><i></i></div>
                  <div><span>Avg Citations/Paper</span><strong>42.8</strong><i></i></div>
                </div>
                <div className="report-bar-chart" aria-label="Publication bar chart">
                  {[35, 48, 58, 74, 86].map((height, index) => <i style={{ height: `${height}%` }} key={index}></i>)}
                  <span></span>
                </div>
                <table className="report-author-table">
                  <thead>
                    <tr><th>Top Authors</th><th>Pubs</th><th>Trend Score A</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>J. Smith et al.</td><td>42</td><td>89.4</td></tr>
                    <tr><td>A. Johnson</td><td>38</td><td>85.1</td></tr>
                    <tr><td>L. Williams</td><td>31</td><td>72.0</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-history-card">
              <div className="report-panel-heading">
                <h2><MiniIcon path="M4 12a8 8 0 1 0 2.3-5.7M4 5v5h5M12 8v5l3 2" /> Report History</h2>
                <span>Last 10 reports</span>
              </div>
              <table>
                <thead>
                  <tr><th>Report Name</th><th>Date Generated</th><th>Format</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {reportHistoryRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.date}</td>
                      <td><span className={row.format === "Excel" ? "excel" : "csv"}>{row.format}</span></td>
                      <td><a href="/researcher-reports" onClick={navTo("/researcher-reports")}>Download</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <a className="report-history-link" href="/researcher-reports" onClick={navTo("/researcher-reports")}>View all historical reports</a>
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
          {card.bars.map((height, index) => <i style={{ height: `${height}%` }} key={index}></i>)}
        </div>
      ) : (
        <div className="year-rank-grid">
          {card.ranks.map((rank, index) => <span className={card.danger && index === 1 ? "danger" : ""} key={rank}>{rank}</span>)}
        </div>
      )}
      {card.subvalue ? <b className={card.danger ? "danger" : ""}>{card.subvalue}</b> : null}
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
  const getX = (index) => padding.left + (index / (yearTrajectoryData.length - 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = yearTrajectoryData.map((item, index) => ({ ...item, x: getX(index), yBase: getY(item.baseline), yComp: getY(item.comparison) }));
  const baselinePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yBase}`).join(" ");
  const comparisonPath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.yComp}`).join(" ");

  return (
    <section className="year-chart-card">
      <div className="year-chart-heading">
        <h2>Publication Volume<br />Trajectory</h2>
        <div className="year-chart-legend">
          <span><i className="baseline"></i> 2024<br />(Baseline)</span>
          <span><i className="comparison"></i> 2025<br />(Comparison)</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Publication volume trajectory comparing 2024 and 2025">
        <g className="year-grid">
          {[0, 500, 1000, 1500].map((tick) => (
            <path key={tick} d={`M${padding.left} ${getY(tick)}H${width - padding.right}`} />
          ))}
        </g>
        <g className="year-y-labels">
          {[0, 500, 1000, 1500].map((tick) => (
            <text key={tick} x={padding.left - 16} y={getY(tick) + 4} textAnchor="end">{tick === 0 ? "0" : `${(tick / 1000).toFixed(tick === 1000 ? 1 : 1)}k`}</text>
          ))}
        </g>
        <path className="year-axis" d={`M${padding.left} ${height - padding.bottom}H${width - padding.right}`} />
        <path className="year-baseline-line" d={baselinePath} />
        <path className="year-comparison-line" d={comparisonPath} />
        {points.map((point, index) => (
          <g key={`${point.quarter}-${index}`}>
            <circle className="year-comparison-point" cx={point.x} cy={point.yComp} r={index === points.length - 1 ? "9" : "8"} />
            {index < 4 ? <text x={point.x} y={height - 12} textAnchor="middle">{point.quarter}</text> : null}
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
          <tr><th>Keyword</th><th>Delta</th></tr>
        </thead>
        <tbody>
          {yearKeywordDiff.map((row) => (
            <tr key={row.keyword}>
              <td>{row.keyword}</td>
              <td><span className={row.tone}>{row.delta}</span></td>
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
          <form className="year-controls" onSubmit={navTo("/researcher-year-comparison")}>
            <label>Baseline <select defaultValue="2024"><option>2024</option><option>2023</option></select></label>
            <MiniIcon path="M8 7h10M14 3l4 4-4 4M16 17H6M10 13l-4 4 4 4" />
            <label>Comparison <select defaultValue="2025"><option>2025</option><option>2024</option></select></label>
            <button type="submit"><MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" /> Export Data</button>
          </form>
        </section>

        <section className="year-metric-grid" aria-label="Year comparison metrics">
          {yearMetricCards.map((card) => <YearMetricCard card={card} key={card.label} />)}
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
        <div><span>Synced Records</span><strong>{source.synced}</strong></div>
        <div><span>Latency</span><strong>{source.latency}</strong></div>
        <div><span>Coverage</span><strong>{source.coverage}</strong></div>
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
            <p>Monitor publication metadata ingestion, API comparison samples, normalization, scheduled jobs, and failure logs.</p>
          </div>
          <div className="sync-hero-actions">
            <button type="button" className="sync-secondary-button"><MiniIcon path="M4 4v6h6M20 20v-6h-6M20 8a7 7 0 0 0-12.1-4M4 16a7 7 0 0 0 12.1 4" /> Run Dry Check</button>
            <button type="button" className="sync-primary-button"><MiniIcon path="M12 5v14M5 12h14" /> Start Sync</button>
          </div>
        </section>

        <section className="sync-source-grid" aria-label="Sync data sources">
          {syncSourceCards.map((source) => <SyncSourceCard source={source} key={source.name} />)}
        </section>

        <div className="sync-dashboard-grid">
          <section className="sync-panel sync-pipeline-panel">
            <div className="sync-panel-heading">
              <h2><MiniIcon path="M4 7h4l3 10h4l3-10h2" /> Metadata Pipeline</h2>
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
              <h2><MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6z" /> Hangfire Schedule</h2>
              <button type="button">Configure</button>
            </div>
            <table>
              <thead>
                <tr><th>Job</th><th>Schedule</th><th>Last Run</th><th>Duration</th><th>Status</th></tr>
              </thead>
              <tbody>
                {syncJobs.map((job) => (
                  <tr key={job.job}>
                    <td>{job.job}</td>
                    <td>{job.schedule}</td>
                    <td>{job.lastRun}</td>
                    <td>{job.duration}</td>
                    <td><span className={job.status.toLowerCase()}>{job.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="sync-panel sync-health-panel">
            <div className="sync-panel-heading">
              <h2><MiniIcon path="M12 21s8-4.5 8-11V5l-8-3-8 3v5c0 6.5 8 11 8 11Z" /> Database Health</h2>
            </div>
            <div className="sync-health-grid">
              <div><span>Canonical Publications</span><strong>152,900</strong><i style={{ width: "88%" }}></i></div>
              <div><span>Normalized Authors</span><strong>48,730</strong><i style={{ width: "74%" }}></i></div>
              <div><span>Duplicate Merge Rate</span><strong>3.8%</strong><i style={{ width: "38%" }}></i></div>
              <div><span>Error Queue</span><strong>42</strong><i className="danger" style={{ width: "24%" }}></i></div>
            </div>
          </section>

          <section className="sync-panel sync-log-panel">
            <div className="sync-panel-heading">
              <h2><MiniIcon path="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5" /> Sync Logs & Errors</h2>
              <span>Live logging</span>
            </div>
            <div className="sync-log-list">
              {syncLogs.map((log) => (
                <article className={`sync-log ${log.level.toLowerCase()}`} key={`${log.time}-${log.message}`}>
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
      <button type="button" className="researcher-menu-button" aria-label="Toggle navigation" onClick={onMenuClick}>
        <MiniIcon path="M4 6h16M4 12h16M4 18h16" />
      </button>
      <nav className="researcher-graph-breadcrumb" aria-label="Breadcrumb">
        <a href="/researcher-dashboard" onClick={navTo("/researcher-dashboard")}>Dashboard</a>
        <span>&gt;</span>
        <strong>Knowledge Graph</strong>
      </nav>

      <form className="researcher-graph-search" onSubmit={navTo("/researcher-search")}>
        <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
        <input type="search" defaultValue="DeepFruits: A Fruit Detection System..." aria-label="Search knowledge graph" />
      </form>

      <div className="researcher-graph-actions">
        <button type="button" className="graph-toolbar-button">
          <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
          List View
        </button>
        <button type="button" className="graph-toolbar-button active">
          <MiniIcon path="M4 5h16l-6.2 7.1V18l-3.6 1.6v-7.5L4 5Z" />
          Filters
        </button>
        <button type="button" className="graph-icon-button" aria-label="Help">
          <MiniIcon path="M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </button>
        <button type="button" className="graph-icon-button" aria-label="Settings">
          <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
        </button>
      </div>
    </header>
  );
}

function ResearcherPublicationTopbar({ onMenuClick }) {
  return (
    <header className="researcher-topbar researcher-publication-topbar">
      <button type="button" className="researcher-menu-button" aria-label="Toggle navigation" onClick={onMenuClick}>
        <MiniIcon path="M4 6h16M4 12h16M4 18h16" />
      </button>
      <nav className="researcher-breadcrumb" aria-label="Breadcrumb">
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>Search</a>
        <span>&gt;</span>
        <a href="/researcher-search" onClick={navTo("/researcher-search")}>Results</a>
        <span>&gt;</span>
        <strong>Deep Learning for Advanced Pattern Recognition...</strong>
      </nav>

      <div className="researcher-top-actions">
        <form className="researcher-search" onSubmit={navTo("/researcher-search")}>
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input type="search" placeholder="Search..." aria-label="Search publications" />
        </form>
        <button type="button" className="researcher-top-icon" aria-label="Notifications" onClick={navTo("/researcher-notifications")}>
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button type="button" className="researcher-top-icon" aria-label="Settings">
          <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
        </button>
        <button type="button" className="researcher-avatar" aria-label="User profile" onClick={navTo("/researcher-profile")}>
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Researcher profile" />
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
    scene.add(graphGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(160, 220, 340);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc7d2fe, 1.1);
    fillLight.position.set(-260, -120, 220);
    scene.add(fillLight);

    const nodeById = Object.fromEntries(graph3DNodes.map((node) => [node.id, node]));
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
      })
    );
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.055, 16, 120),
      new THREE.MeshBasicMaterial({
        color: 0x9a4a88,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
      })
    );
    selectionGroup.add(selectionHalo, selectionRing);
    selectionGroup.visible = false;
    graphGroup.add(selectionGroup);

    graph3DNodes.forEach((node) => {
      const selectedRadius = node.size;
      const idleRadius = Math.max(node.size * 0.42, 8);
      const radius = node.id === selectedNodeIdRef.current ? selectedRadius : idleRadius;
      const position = new THREE.Vector3(...node.position);
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: node.id === selectedNodeIdRef.current ? 0.72 : 0.82,
        roughness: 0.48,
        metalness: 0.05,
      });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), material);
      sphere.position.copy(position);
      sphere.scale.setScalar(radius);
      sphere.userData.nodeId = node.id;
      graphGroup.add(sphere);
      nodeMeshes.push(sphere);

      const label = document.createElement("span");
      label.className = node.id === selectedNodeIdRef.current ? "graph-3d-label selected" : "graph-3d-label";
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
        item.label.className = active ? "graph-3d-label selected" : "graph-3d-label";
      });

      if (selectedItem) {
        selectionGroup.visible = true;
        selectionGroup.position.copy(selectedItem.sphere.position);
        selectionGroup.scale.setScalar(selectedItem.currentRadius);
      }
    };

    selectionApiRef.current = { applySelection };
    applySelection(selectedNodeIdRef.current);

    const resize = () => {
      const width = Math.max(mount.clientWidth, 320);
      const height = Math.max(mount.clientHeight, 320);
      const isNarrow = width < 620;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = isNarrow ? 1060 : 780;
      graphGroup.position.x = isNarrow ? -86 : 22;
      graphGroup.position.y = isNarrow ? 14 : 0;
      controls.minDistance = isNarrow ? 620 : 360;
      controls.maxDistance = isNarrow ? 1320 : 980;
      camera.updateProjectionMatrix();
      controls.update();
    };

    let graphZoom = 1;
    const setGraphZoom = (nextZoom) => {
      graphZoom = THREE.MathUtils.clamp(nextZoom, 0.72, 1.62);
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
      return raycaster.intersectObjects(nodeMeshes, false)[0]?.object.userData.nodeId;
    };

    const handlePointerDown = (event) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      controls.autoRotate = false;
    };

    const handlePointerMove = (event) => {
      renderer.domElement.style.cursor = getIntersectedNodeId(event) ? "pointer" : "grab";
    };

    const handlePointerUp = (event) => {
      if (!pointerDown) return;
      const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
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
        const depthScale = THREE.MathUtils.clamp(1.08 - projectedPosition.z * 0.22, 0.72, 1.08);
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
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
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
    <section className="knowledge-graph-panel" aria-label="Research knowledge graph">
      <div className="knowledge-graph-webgl" ref={mountRef} aria-hidden="true"></div>
      <div className="knowledge-graph-label-layer" ref={labelLayerRef} aria-hidden="true"></div>

      <div className="graph-zoom-controls" aria-label="Zoom controls">
        <button type="button" aria-label="Zoom in" onClick={() => graphActionsRef.current.zoomIn?.()}>+</button>
        <button type="button" aria-label="Zoom out" onClick={() => graphActionsRef.current.zoomOut?.()}>-</button>
      </div>

      <div className="graph-bottom-bar">
        <button type="button" className="compare-paper-button">
          <MiniIcon path="M12 5v14M5 12h14" />
          Compare New Paper
        </button>
        <label className="year-range-control">
          <span>Year Range</span>
          <em>2010</em>
          <input type="range" min="2010" max="2024" defaultValue="2020" aria-label="Start year" />
          <input type="range" min="2010" max="2024" defaultValue="2024" aria-label="End year" />
          <em>2024</em>
        </label>
      </div>
    </section>
  );
}

function ResearcherPaperPanel({ selectedNode }) {
  const selectedPaper = getGraphPaperForNode(selectedNode);

  return (
    <aside className="researcher-paper-panel" aria-label="Selected research paper">
      <div className="paper-panel-actions">
        <span>Selected Node</span>
        <div>
          <button type="button" aria-label="Share paper">
            <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
          </button>
          <button type="button" aria-label="Open paper" onClick={navTo("/researcher-publication")}>
            <MiniIcon path="M7 7h10v10M7 17 17 7" />
          </button>
        </div>
      </div>

      <h1>
        <a href="/researcher-publication" onClick={navTo("/researcher-publication")}>
          {selectedPaper.title}
        </a>
      </h1>
      <p className="paper-authors">{selectedPaper.authors}</p>
      <div className="paper-meta-row">
        <span>{selectedPaper.year}</span>
        <span><MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />{selectedPaper.venue}</span>
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
        <a href="/researcher-publication" onClick={navTo("/researcher-publication")}>Read full abstract</a>
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
          <a href="/researcher-search" onClick={navTo("/researcher-search")} key={point}>
            <MiniIcon path={index === 0 ? "M7 5h10v14H7zM10 9h4M10 12h4M10 15h3" : "M12 4 5 19h14L12 4ZM12 9v4M12 16h.01"} />
            {point}
          </a>
        ))}
      </section>
    </aside>
  );
}

function ResearcherSearchPage() {
  const [selectedNodeId, setSelectedNodeId] = React.useState("deepfruits");
  const selectedNode = React.useMemo(
    () => graph3DNodes.find((node) => node.id === selectedNodeId) || graph3DNodes[0],
    [selectedNodeId]
  );

  return (
    <ResearcherShell activeRoute="/researcher-search" topbar="graph" pageClassName="researcher-search-page" mainClassName="researcher-graph-main">
        <div className="researcher-graph-layout">
          <KnowledgeGraphCanvas selectedNodeId={selectedNode.id} onSelectNode={setSelectedNodeId} />
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
        <label><input type="radio" name="source" defaultChecked /> Semantic Scholar</label>
        <label><input type="radio" name="source" /> OpenAlex</label>
      </section>

      <section className="filter-card">
        <h3>Keywords</h3>
        <div className="keyword-chips">
          <span>Machine Learning <button type="button" aria-label="Remove Machine Learning">x</button></span>
          <span>Neural Networks <button type="button" aria-label="Remove Neural Networks">x</button></span>
          <button type="button">+ Add</button>
        </div>
      </section>
    </aside>
  );
}

function SearchResultCard({ result }) {
  return (
    <article className="search-result-card">
      <button className={`result-save ${result.saved ? "saved" : ""}`} type="button" aria-label="Save publication">
        <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
      </button>
      <a className="result-title-link" href="/student-publication" onClick={navTo("/student-publication")}>
        <h2>{result.title}</h2>
      </a>
      <p className="result-authors">{result.authors}</p>
      <p className="result-abstract">{result.abstract}</p>
      <div className="result-meta-row">
        <div className="result-meta">
          <span><MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />{result.year}</span>
          <span><MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />{result.source}</span>
          <strong>99 {result.citations} Citations</strong>
        </div>
        <a href="/student-publication" onClick={navTo("/student-publication")}>View Source <span aria-hidden="true">-&gt;</span></a>
      </div>
    </article>
  );
}

function StudentSearchPage() {
  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar crumb={<div className="topbar-breadcrumb">Dashboard <span>&gt;</span> <strong>Search Results</strong></div>} searchValue="" wideSearch />

        <div className="student-content search-content">
          <h1 className="search-page-title">Publication Search</h1>

          <div className="search-layout">
            <SearchFilterPanel />

            <section className="search-results-area" aria-label="Publication search results">
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
                  <button type="button" aria-label="Previous page">&lt;</button>
                  <button className="active" type="button">1</button>
                  <button type="button">2</button>
                  <button type="button">3</button>
                  <span>...</span>
                  <button type="button">125</button>
                  <button type="button" aria-label="Next page">&gt;</button>
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
        <span><MiniIcon path="M7 4v3M17 4v3M5 8h14M6 6h12v13H6z" />{paper.date}</span>
        <span><MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" />{paper.citations} Citations</span>
        <span><MiniIcon path="M4 15.5 9.2 10l3.4 3L20 6.5" />Impact: {paper.impact}</span>
      </div>
    </article>
  );
}

function BookmarksPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Publications");
  const isResearcher = role === "researcher";
  const detailPath = isResearcher ? "/researcher-publication" : "/student-publication";
  const dashboardPath = isResearcher ? "/researcher-dashboard" : "/student-dashboard";

  if (isResearcher) {
    return (
      <ResearcherShell activeRoute="/researcher-bookmarks" current="Bookmarks" pageClassName="bookmarks-page researcher-bookmarks-page" mainClassName="researcher-bookmarks-main">
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
            <section className="bookmark-paper-list" aria-label="Bookmarked publications">
              {bookmarkedPapers.map((paper) => (
                <BookmarkPaperCard paper={paper} detailPath={detailPath} key={paper.title} />
              ))}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section className="bookmark-keyword-list" aria-label="Bookmarked keywords">
              {bookmarkedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">{keyword.trend}</span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>View Analytics -&gt;</a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section className="bookmark-journal-list" aria-label="Bookmarked journals">
              {bookmarkedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>Impact Factor: <strong>{journal.impactFactor}</strong></span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>View Journal -&gt;</a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section className="bookmark-topic-list" aria-label="Bookmarked topics">
              {bookmarkedTopics.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>Tracked: <strong>{topic.tracked}</strong></span>
                    <span className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}>{topic.activity}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>View Topic -&gt;</a>
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
        <StudentTopbar crumb={<div className="topbar-breadcrumb">Dashboard <span>&gt;</span> <strong>Bookmarks</strong></div>} variant="utility" searchPlaceholder="Search..." />

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
            <section className="bookmark-paper-list" aria-label="Bookmarked publications">
              {bookmarkedPapers.map((paper) => (
                <BookmarkPaperCard paper={paper} detailPath={detailPath} key={paper.title} />
              ))}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section className="bookmark-keyword-list" aria-label="Bookmarked keywords">
              {bookmarkedKeywords.map((keyword) => (
                <article className="bookmark-keyword-card" key={keyword.name}>
                  <div className="card-header">
                    <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                    <h2>{keyword.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>{keyword.count}</span>
                    <span className="trend-badge positive">{keyword.trend}</span>
                  </div>
                  <a href={dashboardPath} onClick={navTo(dashboardPath)}>View Analytics -&gt;</a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Journals" && (
            <section className="bookmark-journal-list" aria-label="Bookmarked journals">
              {bookmarkedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>Impact Factor: <strong>{journal.impactFactor}</strong></span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>View Journal -&gt;</a>
                </article>
              ))}
            </section>
          )}

          {activeTab === "Topics" && (
            <section className="bookmark-topic-list" aria-label="Bookmarked topics">
              {bookmarkedTopics.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>Tracked: <strong>{topic.tracked}</strong></span>
                    <span className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}>{topic.activity}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>View Topic -&gt;</a>
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
        <section className={groupIndex > 0 ? "separated" : ""} key={`${group.title}-${groupIndex}`}>
          {group.title ? <h2>{group.title}</h2> : null}
          <div className="notification-filter-options">
            {group.options.map((option) => (
              <label className={option.active ? "active" : ""} key={option.label}>
                <input type="radio" name={`notification-filter-${groupIndex}`} defaultChecked={option.active} />
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
    const subParts = part.split(/(Deep Learning|Nature Physics|ArXiv|Semantic Scholar|OpenAlex)/g);
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
    <article className={`notification-card ${item.tone} ${item.unread ? "unread" : ""}`}>
      <div className={`notification-icon ${item.tone}`}>
        <MiniIcon path={item.icon} />
      </div>
      <div className="notification-body">
        <div className="notification-meta">
          <span>{item.type}</span>
          <i aria-hidden="true"></i>
          <span>{item.time}</span>
        </div>
        <p>{item.title ? <strong>{item.title} </strong> : null}{renderFormattedText(item.text)}</p>
      </div>
      {item.unread ? <span className="notification-unread-dot" aria-label="Unread notification"></span> : null}
      {item.bookmarked ? (
        <button type="button" className="notification-bookmark" aria-label="Save notification">
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
    text: "Dr. Elena Rostova published \"Topological Regularization in Deep Autoencoders\" in Nature Computational Science.",
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
    text: "Keyword \"Single-cell RNA\" citation velocity increased by 28% in computational biology journals.",
    icon: "M5 15.5 9.2 11l3.2 2.6L19 7M16 7h3v3",
    tone: "green",
    unread: false,
  }
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
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  };

  const pageContent = (
    <div className={isResearcher ? "researcher-notifications-content notifications-content" : "student-content notifications-content"}>
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on publications, trends, and system alerts.</p>
        </div>
        <button type="button" className="mark-read-button" onClick={handleMarkAllRead}>
          <MiniIcon path="M5 12.5 9 16.5 19 6.5" />
          Mark all as read
        </button>
      </div>

      <div className="notifications-layout">
        <NotificationFilterPanel />
        <section className="notification-list" aria-label="Notifications list">
          {notifications.map((item, index) => (
            <NotificationCard item={item} key={`${item.type}-${item.time}-${index}`} />
          ))}
          {hasMore ? (
            <button type="button" className="load-more-button" onClick={handleLoadMore}>Load More</button>
          ) : (
            <div className="no-more-notifications" style={{ textAlign: "center", color: "#6b7280", fontSize: "13px", padding: "12px", background: "#fff", border: "1px dashed #cbd2df", borderRadius: "8px" }}>No more notifications</div>
          )}
        </section>
      </div>
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell activeRoute="/researcher-notifications" current="Notifications" pageClassName="notifications-page researcher-notifications-page" mainClassName="researcher-notifications-main">
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app notifications-page">
      <StudentSidebar activeRoute="/student-notifications" />
      <section className="student-main">
        <StudentTopbar crumb={<div className="topbar-breadcrumb">Dashboard <span>&gt;</span> <strong>Notifications</strong></div>} variant="utility" searchPlaceholder="Search ScholarTrend..." />
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
        {locked ? <MiniIcon path="M6 10h12v9H6zM8.5 10V7.8a3.5 3.5 0 0 1 7 0V10" /> : null}
      </span>
    </label>
  );
}

function ProfilePage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Personal Info");
  const isResearcher = role === "researcher";

  const pageContent = (
        <div className={isResearcher ? "researcher-profile-content profile-content" : "student-content profile-content"}>
          <h1>User Profile</h1>
          <p className="profile-subtitle">Manage your personal information, security, and academic preferences.</p>

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
                      <button type="button" className="upload-button">Upload New</button>
                      <button type="button" className="remove-button">Remove</button>
                    </div>
                    <p>JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="profile-form-grid">
                  <ProfileField label="Full Name" value="Dr. Alexander Scientist" />
                  <ProfileField label="Email Address (Read-only)" value="alexander.s@scholartrend.edu" readOnly locked />
                  <ProfileField label="Institution" value="Institute of Advanced Analytics" />
                  <ProfileField label="Department" value="Computational Biology" />
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
                      <input type="password" placeholder="••••••••" style={{ maxWidth: "45%" }} />
                    </span>
                  </label>
                  <label className="profile-field">
                    <span>New Password</span>
                    <span className="profile-input">
                      <input type="password" placeholder="••••••••" />
                    </span>
                  </label>
                  <label className="profile-field">
                    <span>Confirm New Password</span>
                    <span className="profile-input">
                      <input type="password" placeholder="••••••••" />
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
                <p style={{ fontSize: "13px", color: "#4b5563", marginBottom: "20px" }}>
                  Manage the research keywords and topics you follow to customize your dashboard feeds and alert notifications.
                </p>
                <div className="keyword-chips" style={{ marginBottom: "20px" }}>
                  <span>Deep Learning <button type="button" aria-label="Remove Deep Learning" style={{ cursor: "pointer" }}>x</button></span>
                  <span>Computational Biology <button type="button" aria-label="Remove Computational Biology" style={{ cursor: "pointer" }}>x</button></span>
                  <span>Quantum Computing <button type="button" aria-label="Remove Quantum Computing" style={{ cursor: "pointer" }}>x</button></span>
                  <span>Single-cell RNA <button type="button" aria-label="Remove Single-cell RNA" style={{ cursor: "pointer" }}>x</button></span>
                  <button type="button" style={{ borderStyle: "dashed", cursor: "pointer" }}>+ Add Keyword</button>
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
                    <h3 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px", color: "#111827" }}>Notification Frequency</h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                        <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", margin: 0 }} /> Real-time alerts for new publication matches
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                        <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", margin: 0 }} /> Weekly summary email digest
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                        <input type="checkbox" style={{ width: "16px", height: "16px", margin: 0 }} /> System health & sync status alerts
                      </label>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: "800", marginBottom: "10px", color: "#111827" }}>Default Search Sources</h3>
                    <div style={{ display: "grid", gap: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                        <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", margin: 0 }} /> Semantic Scholar API
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#374151" }}>
                        <input type="checkbox" defaultChecked style={{ width: "16px", height: "16px", margin: 0 }} /> OpenAlex Database
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <div className="profile-action-bar">
            <button type="button" className="profile-cancel">Cancel</button>
            <button type="button" className="profile-save">
              <MiniIcon path="M5 5h14v14H5zM8 5v5h8V5M8 19v-5h8v5" />
              Save Changes
            </button>
          </div>
        </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell activeRoute="/researcher-profile" current="Profile" pageClassName="profile-page researcher-profile-page" mainClassName="researcher-profile-main">
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app profile-page">
      <StudentSidebar activeRoute="/student-profile" />
      <section className="student-main">
        <StudentTopbar crumb={<div className="topbar-breadcrumb">Dashboard <span>&gt;</span> <strong>Profile</strong></div>} variant="profile" searchPlaceholder="Search ScholarTrend..." />
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
        <div className="percentile-bar"><i></i></div>
        <strong className="percentile-label">Top 2% in Computational Biology</strong>
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
  const topics = ["Deep Learning", "Single-cell RNA", "Manifold Learning", "Autoencoders", "Biological Trajectories"];

  return (
    <aside className="topics-card">
      <h2>Extracted Topics</h2>
      <div>
        {topics.map((topic) => <span key={topic}>{topic}</span>)}
      </div>
    </aside>
  );
}

function StudentPublicationDetailPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Abstract");
  const isResearcher = role === "researcher";

  const pageContent = (
        <div className={`${isResearcher ? "researcher-detail-content" : "student-content"} detail-content`}>
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
                    <button type="button" className="cite-button">99 Cite</button>
                  </div>
                </div>

                <h1>Deep Learning for Advanced Pattern Recognition in Complex Biological Systems</h1>
                <p className="detail-authors"><strong>Dr. Elena Rostova</strong>, Marcus Thorne, Jin-Soo Park</p>
                <p className="detail-journal"><MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" /> Nature Computational Science  (2023)</p>

                <div className="detail-meta-strip">
                  <span><MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" /> 1,428 Citations</span>
                  <a
                    href={isResearcher ? "/researcher-publication" : "/student-publication"}
                    onClick={navTo(isResearcher ? "/researcher-publication" : "/student-publication")}
                  >
                    DOI: 10.1038/s43588-023-00123-x -&gt;
                  </a>
                </div>
              </article>

              <article className="publication-tabs-card">
                <nav className="detail-tabs" aria-label="Publication metadata tabs">
                  {["Abstract", "Keywords", "Authors", "Raw Metadata"].map((tab) => (
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

                {activeTab === "Abstract" && (
                  <div className="abstract-body">
                    <h2>Abstract</h2>
                    <p>
                      The integration of deep neural networks into the analysis of multi-omic biological
                      data presents significant challenges due to the high dimensionality and inherent
                      noise of the datasets. In this paper, we introduce a novel manifold learning
                      architecture designed specifically for extracting stable structural features from
                      single-cell RNA sequencing data. By employing a sparse autoencoder with a custom
                      topological regularization term, our model achieves state-of-the-art performance
                      in identifying rare cell populations.
                    </p>

                    <h3>Key Findings</h3>
                    <ul>
                      <li>Novel architecture improves rare cell detection by 24% over baseline models.</li>
                      <li>Topological regularization prevents manifold fragmentation during training.</li>
                      <li>The proposed method scales to datasets exceeding 10 million cells.</li>
                    </ul>
                  </div>
                )}

                {activeTab === "Keywords" && (
                  <div className="abstract-body keywords-tab-body">
                    <h2>Keywords</h2>
                    <p style={{ marginBottom: "24px" }}>The following semantic concepts were extracted from this publication and cross-referenced with your tracked items.</p>
                    <div className="keyword-chips-list" style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                      <span className="keyword-chip-large" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "10px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "14px" }}>
                        <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                        <strong>Deep Learning</strong>
                        <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "12px" }}>(Tracked)</span>
                      </span>
                      <span className="keyword-chip-large" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "10px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "14px" }}>
                        <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                        <strong>Single-cell RNA</strong>
                        <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "12px" }}>(Tracked)</span>
                      </span>
                      <span className="keyword-chip-large" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "10px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "14px" }}>
                        <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                        <strong>Manifold Learning</strong>
                      </span>
                      <span className="keyword-chip-large" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "10px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "14px" }}>
                        <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                        <strong>Autoencoders</strong>
                      </span>
                      <span className="keyword-chip-large" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "10px 16px", borderRadius: "8px", color: "#ffffff", fontSize: "14px" }}>
                        <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                        <strong>Biological Trajectories</strong>
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === "Authors" && (
                  <div className="abstract-body authors-tab-body">
                    <h2>Authors</h2>
                    <div style={{ display: "grid", gap: "20px", marginTop: "24px" }}>
                      <div style={{ display: "flex", gap: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", padding: "20px", borderRadius: "12px", alignItems: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--brand)", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>ER</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>Dr. Elena Rostova</h3>
                          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#94a3b8" }}>Institute of Advanced Analytics  ·  Computational Biology</p>
                          <span style={{ fontSize: "12px", color: "#6366f1", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>ORCID: 0000-0002-1825-0097</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", padding: "20px", borderRadius: "12px", alignItems: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#4f46e5", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>MT</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>Marcus Thorne</h3>
                          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#94a3b8" }}>University of Applied Sciences  ·  Deep Learning Lab</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "16px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.06)", padding: "20px", borderRadius: "12px", alignItems: "center" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#06b6d4", display: "grid", placeItems: "center", fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>JP</div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff" }}>Jin-Soo Park</h3>
                          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#94a3b8" }}>Seoul Institute of Technology  ·  Bioinformatics Research Division</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Raw Metadata" && (
                  <div className="abstract-body metadata-tab-body">
                    <h2>Raw Metadata</h2>
                    <p style={{ marginBottom: "20px" }}>API metadata payload returned from the indexing data source.</p>
                    <pre style={{ background: "#0b0f19", border: "1px solid #1e293b", padding: "20px", borderRadius: "8px", overflowX: "auto", fontSize: "13px", color: "#a5b4fc", fontFamily: "monospace", lineHeight: "1.5" }}>
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
                      <div className="related-icon"><MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" /></div>
                      <div>
                        <h3>{paper.title}</h3>
                        <p>{paper.authors}  •  {paper.meta}</p>
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
      <ResearcherShell activeRoute="/researcher-search" topbar="publication" pageClassName="researcher-publication-page" mainClassName="researcher-publication-main">
        {pageContent}
      </ResearcherShell>
    );
  }

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar crumb="Search  >  Results  >  Deep Learning for Advanced Pattern Recognition..." searchValue="" />
        {pageContent}
      </section>
    </main>
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
  if (path === "/researcher-dashboard") return <ResearcherDashboard />;
  if (path === "/researcher-trend-tracking") return <TrendKeywordsPage />;
  if (path === "/researcher-trend-dashboard") return <TrendTrackingDashboardPage />;
  if (path === "/researcher-reports") return <ReportsPage />;
  if (path === "/researcher-year-comparison") return <YearComparisonPage />;
  if (path === "/researcher-sync-management") return <SyncManagementPage />;
  if (path === "/researcher-search") return <ResearcherSearchPage />;
  if (path === "/researcher-publication") return <StudentPublicationDetailPage role="researcher" />;
  if (path === "/researcher-bookmarks") return <BookmarksPage role="researcher" />;
  if (path === "/researcher-notifications") return <NotificationsPage role="researcher" />;
  if (path === "/researcher-profile") return <ProfilePage role="researcher" />;
  if (path === "/student-dashboard") return <StudentDashboard />;
  if (path === "/student-search") return <StudentSearchPage />;
  if (path === "/student-bookmarks") return <BookmarksPage />;
  if (path === "/student-notifications") return <NotificationsPage />;
  if (path === "/student-profile") return <ProfilePage />;
  if (path === "/student-publication") return <StudentPublicationDetailPage />;
  return <LandingPage />;
}
