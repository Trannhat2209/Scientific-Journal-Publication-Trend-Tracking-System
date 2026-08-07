// Generated module from the former App.jsx.
import React from "react";
import { useTranslation } from "react-i18next";
import DataProvenance from "../../components/academic/DataProvenance";
import TrendScoreInfo from "../../components/academic/TrendScoreInfo";
import { buildPublicationSearchQuery, buildTrendQuery, latestTimestamp } from "../../services/academic-query";
import { MiniIcon, activities, apiFetch, formatCount, getAcademicPath, getAcademicRole, getCurrentAccountPlan, getLocalBookmarks, getPublishedPublications, getSessionDisplayName, getStoredAuth, goToRoute, handleLogout, hasLocalBookmark, isBackendNumericId, mapPublicationForCard, mapPublishedPublicationForCard, mergePublicationsByIdOrTitle, navTo, normalizeRoleForUi, publicationGrowthData, publications, removeLocalBookmark, researcherDomains, researcherNavGroups, sidebarItems, statCards, unwrapList, upsertLocalBookmark, useApiResource, useSearchSuggestions } from "../../app/core.jsx";
import { ResearcherListTopbar, ResearcherPublicationTopbar, ResearcherSearchTopbar } from "./research.jsx";

function StudentSidebar({ activeRoute }) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const session = getCurrentAccountPlan();
  const displayName = session.name || session.email || "Student Account";
  const displayRole = session.role || "Student";
  const avatarUrl =
    session.picture ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";
  const closeMobile = React.useCallback(() => setMobileOpen(false), []);
  const handleNavigate = (route) => (event) => {
    closeMobile();
    navTo(route)(event);
  };

  React.useEffect(() => {
    const openSidebar = () => setMobileOpen(true);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeMobile();
    };

    window.addEventListener("scholartrend:student-sidebar-open", openSidebar);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener(
        "scholartrend:student-sidebar-open",
        openSidebar,
      );
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMobile]);

  React.useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className={`student-sidebar-backdrop ${mobileOpen ? "open" : ""}`}
        aria-label="Close student navigation"
        onClick={closeMobile}
      />
      <aside className={`student-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div
          className="student-logo"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(226, 232, 240, 0.14)",
            position: "relative",
          }}
        >
          <span
            className="student-logo-mark"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
              borderRadius: "8px",
              padding: "8px",
              boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
              flexShrink: 0,
              marginTop: 0,
            }}
          >
            <svg
              viewBox="0 0 32 32"
              width="100%"
              height="100%"
              aria-hidden="true"
            >
              <path
                d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
                fill="white"
                opacity="0.95"
              />
              <path
                d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
                fill="white"
                opacity="0.75"
              />
              <path
                d="M16 4 L10 8 L16 10 L22 8 Z"
                fill="rgba(255, 255, 255, 0.95)"
              />
              <path
                d="M16 4 L16 28"
                stroke="rgba(2, 132, 199, 0.4)"
                strokeWidth="1.5"
              />
              <circle cx="16" cy="28" r="1.5" fill="white" />
            </svg>
          </span>
          <div
            className="student-logo-copy"
            style={{ display: "flex", flexDirection: "column", gap: "2px" }}
          >
            <a
              href="/"
              onClick={handleNavigate("/")}
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "#cbd5e1",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "3px",
                letterSpacing: "0.08em",
                lineHeight: 1,
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline", marginTop: 0 }}>Scholar</span>
              <span
                style={{ color: "#06b6d4", display: "inline", marginTop: 0 }}
              >
                Trend
              </span>
            </a>
            <span
              style={{
                display: "block",
                marginTop: 0,
                maxWidth: "116px",
                fontSize: "11px",
                color: "#7f8aa0",
                fontWeight: 700,
                letterSpacing: "0.06em",
                lineHeight: 1.2,
                textTransform: "uppercase",
              }}
            >
              Analytical
              <br />
              Intelligence
            </span>
          </div>
          <button
            type="button"
            className="student-sidebar-close"
            aria-label="Close navigation"
            onClick={closeMobile}
          >
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </div>

        <nav className="student-nav" aria-label="Student dashboard navigation">
          {sidebarItems.map((item) => (
            <a
              className={item.route === activeRoute ? "active" : ""}
              href={item.route}
              onClick={handleNavigate(item.route)}
              key={item.label}
            >
              <MiniIcon path={item.icon} />
              <span>{t(item.label)}</span>
            </a>
          ))}
        </nav>

        <div className="student-sidebar-footer">
          <a
            className={`sidebar-profile-card ${activeRoute === "/student-profile" ? "active" : ""}`}
            href="/student-profile"
            onClick={handleNavigate("/student-profile")}
          >
            <div className="sidebar-avatar">
              <img src={avatarUrl} alt={`${displayName} avatar`} />
            </div>
            <div className="sidebar-profile-info">
              <strong>{displayName}</strong>
              <span>{displayRole}</span>
            </div>
          </a>
          <button
            type="button"
            className="student-logout-button"
            onClick={handleLogout}
          >
            <MiniIcon path="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
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
  const [queryValue, setQueryValue] = React.useState(searchValue);
  React.useEffect(() => {
    setQueryValue(searchValue || "");
  }, [searchValue]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = queryValue.trim();
    goToRoute(
      query
        ? `/student-search?q=${encodeURIComponent(query)}`
        : "/student-search",
    );
  };

  return (
    <header
      className={`student-topbar ${isUtility ? "utility" : ""} ${isProfileUtility ? "profile-utility" : ""}`}
    >
      <button
        type="button"
        className="student-menu-button"
        aria-label="Toggle navigation"
        onClick={() =>
          window.dispatchEvent(new Event("scholartrend:student-sidebar-open"))
        }
      >
        <MiniIcon path="M5 5h14v14H5zM9 5v14M12 9h4M12 12h4M12 15h3" />
      </button>
      {crumb ? (
        typeof crumb === "string" ? (
          <span className="student-topbar-title">{crumb}</span>
        ) : (
          crumb
        )
      ) : null}
      <div className="student-top-actions">
        <form
          className={`student-global-search ${wideSearch ? "wide" : ""}`}
          onSubmit={handleSearchSubmit}
        >
          <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
          <input
            type="search"
            name="query"
            placeholder={searchPlaceholder}
            value={queryValue}
            onChange={(event) => setQueryValue(event.target.value)}
          />
        </form>
        <div className="topbar-icon-group">
          <button
            type="button"
            aria-label={isUtility ? "Help" : "Notifications"}
            className={`top-icon ${isUtility ? "" : "alert-dot"}`}
            onClick={isUtility ? undefined : navTo("/student-notifications")}
          >
            <MiniIcon
              path={
                isUtility
                  ? "M9.8 9a2.2 2.2 0 1 1 3.7 1.6c-.9.7-1.5 1.2-1.5 2.4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  : "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4"
              }
            />
          </button>
          <button
            type="button"
            aria-label="Settings"
            className="top-icon"
            onClick={navTo("/student-profile")}
          >
            <MiniIcon path="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM19 12h2M3 12h2M12 3v2M12 19v2" />
          </button>
          <button
            type="button"
            aria-label="User profile"
            className="student-avatar image-avatar"
            onClick={navTo("/student-profile")}
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
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [dashboardQuery, setDashboardQuery] = React.useState("");
  const session = getCurrentAccountPlan();
  const displayName = getSessionDisplayName(session, "Student");
  const displayRole = normalizeRoleForUi(session.role || "Student");
  const hasBackendAuth = Boolean(getStoredAuth().accessToken);
  const { data: dashboardSuggestions } = useSearchSuggestions(
    dashboardQuery,
    6,
  );
  const { data: publicationData } = useApiResource("/api/publications?page=1&pageSize=8", [], {
    auth: true,
    select: (payload) => unwrapList(payload).map(mapPublicationForCard),
  });
  const { data: recommendedData } = useApiResource(
    hasBackendAuth ? "/api/recommendations?topN=8" : null,
    [],
    {
      auth: true,
      select: (payload) => unwrapList(payload).map(mapPublicationForCard),
    },
  );
  const publishedPublicationCards = React.useMemo(
    () => getPublishedPublications().map(mapPublishedPublicationForCard),
    [],
  );
  const { data: keywordData } = useApiResource(
    "/api/dashboard/top-keywords?limit=3",
    [],
    {
      select: (payload) =>
        unwrapList(payload)
          .map((item) => item.keyword)
          .filter(Boolean)
          .slice(0, 3),
    },
  );
  const { data: statsData } = useApiResource("/api/dashboard/user-summary", null, { auth: true });
  const studentStats = React.useMemo(() => {
    if (!statsData) return statCards;
    return statCards.map((card) => {
      if (card.label === "My Bookmarks") {
        return { ...card, value: formatCount(statsData.bookmarksCount) };
      }
      if (card.label === "Followed Keywords") {
        return { ...card, value: formatCount(statsData.followsCount) };
      }
      return card;
    });
  }, [statsData]);
  const studentPublications = React.useMemo(
    () =>
      mergePublicationsByIdOrTitle(publishedPublicationCards, publicationData)
        .concat(recommendedData)
        .filter((paper, index, list) => {
          const key = String(paper.id || paper.title).toLowerCase();
          return (
            list.findIndex(
              (item) => String(item.id || item.title).toLowerCase() === key,
            ) === index
          );
        })
        .slice(0, 8)
        .map((paper) => ({
          ...paper,
          saved: hasLocalBookmark(paper, localBookmarks),
        })),
    [
      publicationData,
      publishedPublicationCards,
      recommendedData,
      localBookmarks,
    ],
  );

  const handleTogglePublicationBookmark = async (paper) => {
    const nextSaved = !hasLocalBookmark(paper, localBookmarks);
    const nextLocalBookmarks = nextSaved
      ? upsertLocalBookmark(paper)
      : removeLocalBookmark(paper);
    setLocalBookmarkState(nextLocalBookmarks);

    if (isBackendNumericId(paper.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${paper.id}`, {
        method: nextSaved ? "POST" : "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };

  const handleDashboardSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (dashboardQuery.trim()) params.set("q", dashboardQuery.trim());
    goToRoute(
      `/student-search${params.toString() ? `?${params.toString()}` : ""}`,
    );
  };

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-dashboard" />
      <section className="student-main">
        <StudentTopbar />

        <div className="student-content">
          <div className="student-welcome-row">
            <div>
              <h1>Welcome back, {displayName}</h1>
              <p>
                <span>{displayRole}</span> University of Applied Sciences
              </p>
            </div>
          </div>

          <section className="student-stats" aria-label="Student metrics">
            {studentStats.map((card) => (
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
            <form onSubmit={handleDashboardSearch}>
              <MiniIcon path="M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm5-1.5L20 20" />
              <input
                type="search"
                value={dashboardQuery}
                onChange={(event) => setDashboardQuery(event.target.value)}
                placeholder="Search by title, author, DOI, or keyword..."
                list="student-dashboard-search-suggestions"
              />
              <datalist id="student-dashboard-search-suggestions">
                {dashboardSuggestions.map((suggestion) => (
                  <option value={suggestion} key={suggestion} />
                ))}
              </datalist>
              <button type="submit">Search</button>
            </form>
            <div className="trending-keywords">
              <span>Trending:</span>
              {keywordData.map((keyword) => (
                <a
                  href={`/student-search?q=${encodeURIComponent(keyword)}`}
                  onClick={navTo(
                    `/student-search?q=${encodeURIComponent(keyword)}`,
                  )}
                  key={keyword}
                >
                  {keyword}
                </a>
              ))}
            </div>
          </section>

          <div className="student-dashboard-grid">
            <section className="recommended-publications">
              <div className="section-title-row">
                <h2>Recommended Publications</h2>
                <a href="/student-search" onClick={navTo("/student-search")}>
                  View all -&gt;
                </a>
              </div>
              {studentPublications.map((paper) => (
                <article className="publication-card" key={paper.title}>
                  <button
                    type="button"
                    aria-label={
                      paper.saved ? "Remove bookmark" : "Bookmark publication"
                    }
                    className={`bookmark-button ${paper.saved ? "saved" : ""}`}
                    onClick={() => handleTogglePublicationBookmark(paper)}
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
                  {paper.recommendationReason ? (
                    <small className="recommendation-reason">
                      {paper.recommendationReason}
                    </small>
                  ) : null}
                  <small className="publication-provenance">
                    Source: {paper.source || "Unknown"}
                    {paper.syncedAt
                      ? ` · Synced ${new Date(paper.syncedAt).toLocaleString()}`
                      : ""}
                  </small>
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
  onSettings,
}) {
  const { t } = useTranslation();
  return (
    <aside
      className={`researcher-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      <div
        className="researcher-logo"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
          position: "relative",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            background: "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)",
            borderRadius: "8px",
            padding: "8px",
            boxShadow: "0 2px 8px rgba(6, 182, 212, 0.3)",
            flexShrink: 0,
            marginTop: 0,
          }}
        >
          <svg
            viewBox="0 0 32 32"
            width="100%"
            height="100%"
            aria-hidden="true"
          >
            <path
              d="M16 4 L10 8 L10 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M16 4 L22 8 L22 16 L16 20 L16 12 L16 4 Z"
              fill="white"
              opacity="0.75"
            />
            <path
              d="M16 4 L10 8 L16 10 L22 8 Z"
              fill="rgba(255, 255, 255, 0.95)"
            />
            <path
              d="M16 4 L16 28"
              stroke="rgba(2, 132, 199, 0.4)"
              strokeWidth="1.5"
            />
            <circle cx="16" cy="28" r="1.5" fill="white" />
          </svg>
        </span>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "9px",
            flex: 1,
            minWidth: 0,
            paddingTop: "2px",
          }}
        >
          <a
            href="/"
            onClick={navTo("/")}
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#cbd5e1",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              letterSpacing: "0.08em",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            <span style={{ display: "inline", marginTop: 0 }}>Scholar</span>
            <span style={{ color: "#06b6d4", display: "inline", marginTop: 0 }}>
              Trend
            </span>
          </a>
          <span
            style={{
              display: "block",
              marginTop: 0,
              maxWidth: "116px",
              fontSize: "11px",
              color: "#7f8aa0",
              fontWeight: 700,
              letterSpacing: "0.06em",
              lineHeight: 1.2,
              textTransform: "uppercase",
            }}
          >
            Analytical
            <br />
            Intelligence
          </span>
        </div>
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
            path={collapsed ? "M9 5l7 7-7 7M4 5v14" : "M15 5l-7 7 7 7M20 5v14"}
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
                  <span>{t(item.label)}</span>
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="researcher-sidebar-footer">
        <div className="researcher-footer-actions">
          <a
            href={getAcademicPath("/researcher-profile", role)}
            onClick={navTo(getAcademicPath("/researcher-profile", role))}
            aria-label="Profile"
          >
            <MiniIcon path="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM7 18.2a5.7 5.7 0 0 1 10 0" />
            <span>Profile</span>
          </a>
          <button type="button" aria-label="Settings" onClick={onSettings}>
            <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            <span>Settings</span>
          </button>
          <button
            type="button"
            className="researcher-logout-button"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <MiniIcon path="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
            <span>Logout</span>
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

const defaultAcademicWorkspaceSettings = {
  sources: {
    openAlex: true,
    semanticScholar: true,
    crossref: true,
    arxiv: false,
  },
  alerts: {
    trendSpikes: true,
    citationMilestones: true,
    authorUpdates: true,
    journalQuartileChanges: false,
  },
  privacy: {
    publicProfile: true,
    shareReadingSignals: false,
    showInstitutionDashboard: true,
  },
  defaultDiscipline: "Computer Science",
  trendThreshold: "20% weekly growth",
  digestFrequency: "Weekly",
  citationWindow: "Last 12 months",
  graphDensity: "Balanced",
  exportFormat: "PDF + CSV",
};

const getDefaultAcademicWorkspaceSettings = (role = "researcher") => ({
  ...defaultAcademicWorkspaceSettings,
  defaultDiscipline:
    role === "lecturer" ? "AI in Education" : "Computer Science",
});

const mergeAcademicWorkspaceSettings = (saved, role) => {
  const defaults = getDefaultAcademicWorkspaceSettings(role);
  return {
    ...defaults,
    ...(saved || {}),
    sources: {
      ...defaults.sources,
      ...(saved?.sources || {}),
    },
    alerts: {
      ...defaults.alerts,
      ...(saved?.alerts || {}),
    },
    privacy: {
      ...defaults.privacy,
      ...(saved?.privacy || {}),
    },
  };
};

function AcademicSettingsPanel({ open, onClose, role = "researcher" }) {
  const storageKey = `scholartrend.${role}.workspaceSettings`;
  const roleLabel = role === "lecturer" ? "Lecturer" : "Researcher";
  const readSavedSettings = () => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        return mergeAcademicWorkspaceSettings(JSON.parse(saved), role);
      } catch {
        return getDefaultAcademicWorkspaceSettings(role);
      }
    }

    return getDefaultAcademicWorkspaceSettings(role);
  };
  const [settings, setSettings] = React.useState(readSavedSettings);
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (!open) return undefined;

    setSettings(readSavedSettings());
    setMessage("");

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
  }, [open, role]);

  if (!open) return null;

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateGroupSetting = (group, key, value) => {
    setSettings((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value,
      },
    }));
  };

  const saveSettings = () => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    setMessage("Settings saved for this browser.");
  };

  const resetSettings = () => {
    const defaults = getDefaultAcademicWorkspaceSettings(role);
    setSettings(defaults);
    window.localStorage.setItem(storageKey, JSON.stringify(defaults));
    setMessage("Settings reset to ScholarTrend defaults.");
  };

  const openProfileNotifications = () => {
    saveSettings();
    onClose();
    goToRoute(getAcademicPath("/researcher-profile", role));
  };

  const sourceOptions = [
    [
      "openAlex",
      "OpenAlex",
      "Works, authors, institutions, and concepts",
      "M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5",
      "cyan",
    ],
    [
      "semanticScholar",
      "Semantic Scholar",
      "Citation graph and paper similarity",
      "M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10",
      "indigo",
    ],
    [
      "googleScholar",
      "Google Scholar",
      "Scholar results provided through SerpApi",
      "M7 4.5h7l3 3V20H7zM14 4.5V8h3M10 12h4M10 15h6M10 18h3M4 8v12h3",
      "emerald",
    ],
    [
      "researchGate",
      "ResearchGate",
      "Publication pages discovered through Scholar lookup",
      "M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5ZM8.5 10.2l3.5 2 3.5-2M12 12.2v4.3",
      "amber",
    ],
  ];
  const alertOptions = [
    [
      "trendSpikes",
      "Trend spike alerts",
      "Notify when a keyword accelerates beyond your threshold.",
      "M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3",
    ],
    [
      "citationMilestones",
      "Citation milestones",
      "Track citation gains on saved and authored papers.",
      "M12 19V5M7 10l5-5 5 5M5 19h14",
    ],
    [
      "authorUpdates",
      "Author updates",
      "Watch followed researchers for new publications.",
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    ],
    [
      "journalQuartileChanges",
      "Journal quartile changes",
      "Flag ranking changes for followed journals.",
      "M5 19V5h14v14H5ZM8 15l2.4-2.4 2 1.6L16.5 9M15 9h2v2",
    ],
  ];
  const privacyOptions = [
    [
      "publicProfile",
      "Public academic profile",
      "Allow collaborators to view your research identity.",
      "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0",
    ],
    [
      "shareReadingSignals",
      "Share reading signals",
      "Use saved papers and views to improve recommendations.",
      "M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9v6M9 12h6",
    ],
    [
      "showInstitutionDashboard",
      "Institution dashboard visibility",
      "Include your aggregate activity in department analytics.",
      "M3.5 20h17M5 17V9h4v8M10 17V5h4v12M15 17v-6h4v6",
    ],
  ];

  return (
    <div
      className="academic-settings-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="academic-settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="academic-settings-title"
      >
        <header className="academic-settings-header">
          <div className="academic-settings-title-wrap">
            <i className="academic-settings-hero-icon" aria-hidden="true">
              <MiniIcon path="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.9 3.2-.2-.1a1.8 1.8 0 0 0-2 .2 1.8 1.8 0 0 0-.7 1.7v.2H9v-.2a1.8 1.8 0 0 0-.7-1.7 1.8 1.8 0 0 0-2-.2l-.2.1-1.9-3.2.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.5-1.1H3v-3.8h.2A1.8 1.8 0 0 0 4.7 9a1.8 1.8 0 0 0-.4-2l-.1-.1 1.9-3.2.2.1a1.8 1.8 0 0 0 2-.2A1.8 1.8 0 0 0 9 1.9v-.2h6v.2a1.8 1.8 0 0 0 .7 1.7 1.8 1.8 0 0 0 2 .2l.2-.1 1.9 3.2-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.5 1.1h.2v3.8h-.2A1.8 1.8 0 0 0 19.4 15Z" />
            </i>
            <div>
              <span>{roleLabel} Workspace</span>
              <h2 id="academic-settings-title">Settings</h2>
              <p>
                Control how ScholarTrend tracks publications, trends, and
                alerts.
              </p>
            </div>
          </div>
          <button type="button" aria-label="Close settings" onClick={onClose}>
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>

        <div className="academic-settings-body">
          <div
            className="academic-settings-summary"
            aria-label="Current settings summary"
          >
            <div>
              <i className="summary-icon teal" aria-hidden="true">
                <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" />
              </i>
              <span>
                <small>Trend threshold</small>
                <strong>{settings.trendThreshold}</strong>
              </span>
            </div>
            <div>
              <i className="summary-icon violet" aria-hidden="true">
                <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
              </i>
              <span>
                <small>Digest</small>
                <strong>{settings.digestFrequency}</strong>
              </span>
            </div>
            <div>
              <i className="summary-icon blue" aria-hidden="true">
                <MiniIcon path="M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
              </i>
              <span>
                <small>Sources</small>
                <strong>
                  {Object.values(settings.sources).filter(Boolean).length}{" "}
                  active
                </strong>
              </span>
            </div>
          </div>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon cyan" aria-hidden="true">
                <MiniIcon path="M4 7.5 12 3l8 4.5-8 4.5L4 7.5ZM4 12l8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
              </i>
              <h3>Academic data sources</h3>
            </div>
            <div className="academic-settings-list">
              {sourceOptions.map(([key, label, detail, icon, tone]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i
                      className={`academic-toggle-icon ${tone}`}
                      aria-hidden="true"
                    >
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.sources[key])}
                      onChange={(event) =>
                        updateGroupSetting("sources", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon emerald" aria-hidden="true">
                <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" />
              </i>
              <h3>Trend and citation alerts</h3>
            </div>
            <div className="academic-settings-grid">
              <label>
                <span>Default discipline</span>
                <select
                  value={settings.defaultDiscipline}
                  onChange={(event) =>
                    updateSetting("defaultDiscipline", event.target.value)
                  }
                >
                  <option>Computer Science</option>
                  <option>AI in Education</option>
                  <option>Biomedical Science</option>
                  <option>Environmental Science</option>
                  <option>Business Analytics</option>
                </select>
              </label>
              <label>
                <span>Trend threshold</span>
                <select
                  value={settings.trendThreshold}
                  onChange={(event) =>
                    updateSetting("trendThreshold", event.target.value)
                  }
                >
                  <option>10% weekly growth</option>
                  <option>20% weekly growth</option>
                  <option>35% weekly growth</option>
                  <option>Top 5% topic momentum</option>
                </select>
              </label>
              <label>
                <span>Citation window</span>
                <select
                  value={settings.citationWindow}
                  onChange={(event) =>
                    updateSetting("citationWindow", event.target.value)
                  }
                >
                  <option>Last 30 days</option>
                  <option>Last 6 months</option>
                  <option>Last 12 months</option>
                  <option>All time</option>
                </select>
              </label>
              <label>
                <span>Digest frequency</span>
                <select
                  value={settings.digestFrequency}
                  onChange={(event) =>
                    updateSetting("digestFrequency", event.target.value)
                  }
                >
                  <option>Real time</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </label>
            </div>
            <div className="academic-settings-list">
              {alertOptions.map(([key, label, detail, icon]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i className="academic-toggle-icon rose" aria-hidden="true">
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.alerts[key])}
                      onChange={(event) =>
                        updateGroupSetting("alerts", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon violet" aria-hidden="true">
                <MiniIcon path="M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM7 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 6l8 4M8 18l8-6M6 7v10" />
              </i>
              <h3>Workspace output</h3>
            </div>
            <div className="academic-settings-grid">
              <label>
                <span>Knowledge graph density</span>
                <select
                  value={settings.graphDensity}
                  onChange={(event) =>
                    updateSetting("graphDensity", event.target.value)
                  }
                >
                  <option>Compact</option>
                  <option>Balanced</option>
                  <option>Expanded</option>
                </select>
              </label>
              <label>
                <span>Default report export</span>
                <select
                  value={settings.exportFormat}
                  onChange={(event) =>
                    updateSetting("exportFormat", event.target.value)
                  }
                >
                  <option>PDF</option>
                  <option>CSV</option>
                  <option>PDF + CSV</option>
                  <option>BibTeX + RIS</option>
                </select>
              </label>
            </div>
          </section>

          <section className="academic-settings-section">
            <div className="academic-settings-section-title">
              <i className="academic-section-icon slate" aria-hidden="true">
                <MiniIcon path="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              </i>
              <h3>Privacy and institution sharing</h3>
            </div>
            <div className="academic-settings-list">
              {privacyOptions.map(([key, label, detail, icon]) => (
                <label className="academic-settings-toggle" key={key}>
                  <span className="academic-toggle-copy">
                    <i
                      className="academic-toggle-icon slate"
                      aria-hidden="true"
                    >
                      <MiniIcon path={icon} />
                    </i>
                    <span>
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </span>
                  </span>
                  <span className="academic-toggle-switch">
                    <input
                      type="checkbox"
                      checked={Boolean(settings.privacy[key])}
                      onChange={(event) =>
                        updateGroupSetting("privacy", key, event.target.checked)
                      }
                    />
                    <span className="academic-toggle-track" aria-hidden="true">
                      <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="academic-settings-footer">
          <button
            type="button"
            className="settings-secondary"
            onClick={resetSettings}
          >
            Reset
          </button>
          <button
            type="button"
            className="settings-secondary"
            onClick={openProfileNotifications}
          >
            Profile settings
          </button>
          <button
            type="button"
            className="settings-primary"
            onClick={saveSettings}
          >
            Save Settings
          </button>
          {message ? <p role="status">{message}</p> : null}
        </footer>
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
  onOpenSettings,
  rootLabel = "ScholarTrend",
  rootPath = "/",
  searchPlaceholder = "Search publications, authors, keywords...",
  avatarUrl = "",
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
          onClick={onOpenSettings}
        >
          <MiniIcon path="M5 7h4M13 7h6M11 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 12h9M18 12h1M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17h2M11 17h8M9 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
        </button>
        <button
          type="button"
          className="researcher-avatar"
          aria-label="User profile"
          onClick={navTo("/researcher-profile")}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Researcher profile" />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Researcher profile"
            />
          )}
        </button>
      </div>
    </header>
  );
}

function LecturerTopbar({ onMenuClick, onOpenSettings }) {
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
          <MiniIcon path="M18 16.5H6l1.5-2.2V10a4.5 4.5 0 0 1 9 0v4.3L18 16.5ZM10 19h4M17.5 5.5l1.7-1.7M6.5 5.5 4.8 3.8" />
        </button>
        <button
          type="button"
          className="researcher-top-icon"
          aria-label="Settings"
          onClick={onOpenSettings}
        >
          <MiniIcon path="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM12 3.5v2M12 18.5v2M4.6 7.8l1.7 1M17.7 15.2l1.7 1M4.6 16.2l1.7-1M17.7 8.8l1.7-1M3.5 12h2M18.5 12h2" />
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
  profileAvatarUrl = "",
  publicationTitle = "Publication details",
  children,
}) {
  const sidebar = useResearcherSidebarControls();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const academicRole = getAcademicRole();
  const isLecturer = academicRole === "lecturer";
  const resolvedActiveRoute = getAcademicPath(activeRoute, academicRole);
  const TopbarComponent =
    topbar === "lecturer" ? (
      <LecturerTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "list" ? (
      <ResearcherListTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "graph" ? (
      <ResearcherSearchTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    ) : topbar === "publication" ? (
      <ResearcherPublicationTopbar
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
        publicationTitle={publicationTitle}
      />
    ) : (
      <ResearcherTopbar
        current={current}
        onMenuClick={sidebar.handleMenu}
        onOpenSettings={() => setSettingsOpen(true)}
        rootLabel={breadcrumbRootLabel}
        rootPath={breadcrumbRootPath}
        searchPlaceholder={searchPlaceholder}
        avatarUrl={profileAvatarUrl}
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
        onSettings={() => setSettingsOpen(true)}
      />
      <AcademicSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        role={academicRole}
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

function PublicationGrowthChart({ data = publicationGrowthData, source = "ScholarTrend database", syncedAt = null }) {
  const mappedChartData = Array.isArray(data)
    ? data.map((item) => ({
        year: item.year || "N/A",
        publications: Number(item.publications || 0),
      }))
    : [];
  const chartData = mappedChartData.length
    ? mappedChartData
    : publicationGrowthData;
  const [activeIndex, setActiveIndex] = React.useState(chartData.length - 1);
  React.useEffect(() => {
    setActiveIndex(chartData.length - 1);
  }, [chartData.length]);
  const chartWidth = 720;
  const chartHeight = 430;
  const padding = { top: 28, right: 34, bottom: 54, left: 68 };
  const rawMaxValue = Math.max(
    1,
    ...chartData.map((item) => item.publications),
  );
  const maxValue =
    rawMaxValue <= 4
      ? 4
      : rawMaxValue <= 10
        ? 10
        : rawMaxValue <= 100
          ? Math.ceil(rawMaxValue / 10) * 10
          : rawMaxValue <= 1000
            ? Math.ceil(rawMaxValue / 100) * 100
            : rawMaxValue <= 10000
              ? Math.ceil(rawMaxValue / 1000) * 1000
              : Math.ceil(rawMaxValue / 10000) * 10000;
  const yTicks =
    maxValue <= 10
      ? Array.from(
          { length: maxValue / (maxValue <= 4 ? 1 : 2) + 1 },
          (_, index) => index * (maxValue <= 4 ? 1 : 2),
        )
      : [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const bottom = chartHeight - padding.bottom;
  const formatCount = (value) => {
    if (value === 0) return "0";
    if (value < 1000) return `${value}`;
    return `${Math.round(value / 1000)}k`;
  };
  const formatFullCount = (value) =>
    new Intl.NumberFormat("en-US").format(value);
  const getX = (index) =>
    padding.left + (index / Math.max(chartData.length - 1, 1)) * plotWidth;
  const getY = (value) => padding.top + (1 - value / maxValue) * plotHeight;
  const points = chartData.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.publications),
  }));
  if (!points.length) {
    return null;
  }
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), points.length - 1);
  const activePoint = points[safeActiveIndex] || points[points.length - 1];
  const previousPoint = points[safeActiveIndex - 1];
  const activeDelta = previousPoint?.publications
    ? ((activePoint.publications - previousPoint.publications) /
        previousPoint.publications) *
      100
    : 0;
  const latestPoint = points[points.length - 1];
  const previousYear = points[points.length - 2];
  const yearlyGrowth = previousYear?.publications
    ? ((latestPoint.publications - previousYear.publications) /
        previousYear.publications) *
      100
    : 0;
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
            Publication growth chart from {points[0].year} to{" "}
            {points[points.length - 1].year} based on yearly publication counts.
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
              className={`chart-point-group ${index === safeActiveIndex ? "active" : ""}`}
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
                r={index === safeActiveIndex ? "5" : "4"}
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
      <DataProvenance source={source} syncedAt={syncedAt} compact />
    </section>
  );
}

function TrendingKeywordsCard({ keywords = [] }) {
  return (
    <section className="researcher-side-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Trending Keywords</h2>
          <p>Fastest growing terms in last 30 days</p>
        </div>
      </div>
      <div className="keyword-bars">
        {keywords.map((keyword, index) => (
          <div className="keyword-bar-row" key={keyword.label}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div className="keyword-bar-track">
              <i style={{ width: keyword.width }}></i>
              <strong>{keyword.label}</strong>
            </div>
            <em>
              {keyword.percent}
              <TrendScoreInfo type="growth" calculatedAt={keyword.calculatedAt} />
            </em>
          </div>
        ))}
      </div>
      <DataProvenance
        source="ScholarTrend calculated metrics"
        syncedAt={keywords.map((item) => item.calculatedAt).filter(Boolean).sort().at(-1)}
        timestampLabel="Calculated"
      />
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

function RecentlyPublishedCard({ publications = [] }) {
  const recentPublications = publications.slice(0, 4);

  return (
    <section className="researcher-side-card recently-published-card">
      <div className="researcher-card-heading compact">
        <div>
          <h2>Recently Published</h2>
          <p>Approved papers now visible to all academic users</p>
        </div>
      </div>
      <div className="recently-published-list">
        {recentPublications.length ? (
          recentPublications.map((paper) => {
            const detailPath = `/researcher-publication?id=${encodeURIComponent(
              paper.id,
            )}`;
            const authors = Array.isArray(paper.authors)
              ? paper.authors.join(", ")
              : paper.authors || "Unknown authors";
            return (
              <a href={detailPath} onClick={navTo(detailPath)} key={paper.id}>
                <strong>{paper.title}</strong>
                <span>
                  {authors} | {paper.year || "N/A"}
                </span>
              </a>
            );
          })
        ) : (
          <p>No approved publications yet.</p>
        )}
      </div>
    </section>
  );
}

const lecturerStats = [
  {
    label: "My Bookmarks",
    value: "1,284",
    badge: "+12%",
    tone: "blue",
    icon: "M6 4.5h12v15L12 16l-6 3.5v-15Z",
  },
  {
    label: "Followed Keywords",
    value: "42",
    badge: "+4%",
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

function LecturerTrendingCard({ filters = {} }) {
  const query = buildTrendQuery(filters);
  const { data: trendRows } = useApiResource(`/api/trends?${query}`, [], {
    select: unwrapList,
  });
  const keywords = Object.values(
    trendRows.reduce((result, row) => {
      const label = row.keyword || row.Keyword || "Unknown keyword";
      const score = Number(row.trendingScore ?? row.TrendingScore ?? 0);
      if (!result[label] || score > result[label].value) {
        result[label] = {
          label,
          value: score,
          calculatedAt: row.calculatedAt || row.CalculatedAt,
        };
      }
      return result;
    }, {}),
  )
    .sort((left, right) => right.value - left.value)
    .slice(0, 5);
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
        {keywords.map((keyword) => (
          <div className="lecturer-keyword-row" key={keyword.label}>
            <strong>{keyword.label}</strong>
            <span className="lecturer-keyword-track" aria-hidden="true">
              <i style={{ width: `${Math.max(0, Math.min(100, keyword.value))}%` }}></i>
            </span>
            <em>
              {keyword.value.toFixed(1)}%
              <TrendScoreInfo type="growth" calculatedAt={keyword.calculatedAt} />
            </em>
          </div>
        ))}
      </div>
      <DataProvenance
        source="ScholarTrend calculated metrics"
        syncedAt={latestTimestamp(trendRows)}
        timestampLabel="Calculated"
      />
    </section>
  );
}

function LecturerPublicationsCard({ publishedPublications = [], filters = {} }) {
  const publicationQuery = buildPublicationSearchQuery(filters, { pageSize: 5 });
  const { data: backendFieldPublications } = useApiResource(
    `/api/publications/search?${publicationQuery}`,
    [],
    { select: (payload) => unwrapList(payload).map(mapPublicationForCard) },
  );
  const publicationsForUi = [
    ...publishedPublications.map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: Array.isArray(paper.authors)
        ? paper.authors.join(", ")
        : paper.authors || "Unknown authors",
      journal: paper.journalName || "ScholarTrend Published",
      date: paper.year || "Published",
      citations: formatCount(paper.citationCount || 0),
      published: true,
    })),
    ...backendFieldPublications.map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors || "Unknown authors",
      journal: paper.source || "Scientific Journal",
      date: paper.year || "N/A",
      citations: paper.citations,
      published: isBackendNumericId(paper.id),
    })),
  ].filter((paper, index, list) => {
    const key = String(paper.id || paper.title).toLowerCase();
    return (
      list.findIndex(
        (item) => String(item.id || item.title).toLowerCase() === key,
      ) === index
    );
  });

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
        {publicationsForUi.map((publication) => {
          const detailPath = publication.published
            ? `/lecturer-publication?id=${encodeURIComponent(publication.id)}`
            : "/lecturer-publication";
          return (
            <a
              className="lecturer-publication-item"
              href={detailPath}
              onClick={navTo(detailPath)}
              key={publication.title}
            >
              <span className="lecturer-pdf-tile">PDF</span>
              <span className="lecturer-publication-copy">
                <strong>{publication.title}</strong>
                <small>
                  {publication.authors} <i>-</i> {publication.journal}
                </small>
                {publication.date ? (
                  <em>
                    <span>{publication.date}</span>
                    <span>{publication.citations} Citations</span>
                  </em>
                ) : null}
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export { StudentSidebar, StudentTopbar, StudentDashboard, ResearcherSidebar, proPlanFeatures, defaultAcademicWorkspaceSettings, getDefaultAcademicWorkspaceSettings, mergeAcademicWorkspaceSettings, AcademicSettingsPanel, useResearcherSidebarControls, ResearcherTopbar, LecturerTopbar, ResearcherShell, ResearcherStatCard, PublicationGrowthChart, TrendingKeywordsCard, ResearchDomainsCard, RecentlyPublishedCard, lecturerStats, LecturerStatCard, LecturerTrendingCard, LecturerPublicationsCard };
