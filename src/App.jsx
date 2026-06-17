import React from "react";

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
            <p>Query articles by keyword, author, journal, or topic with filters for year, relevance, and citations.</p>
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
            <p>Surface related publications, similarity scores, duplicate risk, and recommendations.</p>
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
            <p>Monitor publication growth, top keywords, and topic emergence with Raw Count or Growth Rate scoring.</p>
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
              <p>Cross-reference scholarly metadata, normalize records, and keep sync status visible.</p>
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

        <form className="login-card" onSubmit={navTo("/student-dashboard")}>
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
  { label: "Bookmarks", route: "/student-dashboard", icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z" },
  { label: "Notifications", route: "/student-dashboard", icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" },
  { label: "Trend Tracking", route: "/student-dashboard", icon: "M4 16.5 9 12l3.5 3L20 7.5M17 7.5h3v3" },
  { label: "Reports", route: "/student-dashboard", icon: "M5 4.5h14v15H5zM8 15h8M8 11h8M8 7h4" },
  { label: "Year Comparison", route: "/student-dashboard", icon: "M5 19V5M5 19h14M9 15v-4M13 15V8M17 15v-7" },
  { label: "Sync Management", route: "/student-dashboard", icon: "M7 7.5a6 6 0 0 1 10.2-2.8L19 6.5M17 16.5a6 6 0 0 1-10.2 2.8L5 17.5" },
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
        <a href="/student-dashboard" onClick={navTo("/student-dashboard")}><MiniIcon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />Profile</a>
        <a href="/student-dashboard" onClick={navTo("/student-dashboard")}><MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2M17 5l-1.4 1.4M8.4 17.6 7 19M7 5l1.4 1.4M15.6 17.6 17 19" />Settings</a>
        <button type="button">Upgrade to Pro</button>
      </div>
    </aside>
  );
}

function StudentTopbar({ crumb = "Dashboard", searchValue = "", wideSearch = false }) {
  return (
    <header className="student-topbar">
      <span>{crumb}</span>
      <div className="student-top-actions">
        <form className={`student-global-search ${wideSearch ? "wide" : ""}`} onSubmit={navTo("/student-search")}>
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input type="search" placeholder="Search keyword, author, or DOI..." defaultValue={searchValue} />
        </form>
        <button type="button" aria-label="Notifications" className="top-icon alert-dot">
          <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        </button>
        <button type="button" aria-label="Settings" className="top-icon">
          <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
        </button>
        <button type="button" aria-label="User profile" className="student-avatar">A</button>
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
                  <article className="activity-item" key={title}>
                    <MiniIcon path={icon} />
                    <div>
                      <strong>{title}</strong>
                      <span>{meta}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
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
        <StudentTopbar crumb="Dashboard" searchValue="" wideSearch />

        <div className="student-content search-content">
          <div className="breadcrumb">Dashboard <span>&gt;</span> <strong>Search Results</strong></div>
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

function StudentPublicationDetailPage() {
  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
      <section className="student-main">
        <StudentTopbar crumb="Search  >  Results  >  Deep Learning for Advanced Pattern Recognition..." searchValue="" />

        <div className="student-content detail-content">
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
                  <a href="/student-publication">DOI: 10.1038/s43588-023-00123-x -&gt;</a>
                </div>
              </article>

              <article className="publication-tabs-card">
                <nav className="detail-tabs" aria-label="Publication metadata tabs">
                  <button className="active" type="button">Abstract</button>
                  <button type="button">Keywords</button>
                  <button type="button">Authors</button>
                  <button type="button">Raw Metadata</button>
                </nav>

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
  if (path === "/student-dashboard") return <StudentDashboard />;
  if (path === "/student-search") return <StudentSearchPage />;
  if (path === "/student-publication") return <StudentPublicationDetailPage />;
  return <LandingPage />;
}
