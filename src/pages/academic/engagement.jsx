// Generated module from the former App.jsx.
import React from "react";
import { useTranslation } from "react-i18next";
import {
  MiniIcon,
  apiFetch,
  bookmarkTabs,
  getAcademicPath,
  getBookmarkDetailPath,
  getBookmarkKey,
  getLocalBookmarks,
  getRemovedBookmarkKeys,
  getSafeRecipientRoute,
  getStoredAuth,
  goToRoute,
  isBackendNumericId,
  mapPublicationForCard,
  markBookmarkRemoved,
  mergeBookmarkLists,
  navTo,
  notificationFilters,
  unwrapList,
  useApiResource,
} from "../../app/core.jsx";
import { ResearcherShell, StudentSidebar, StudentTopbar } from "./shell.jsx";

function BookmarkPaperCard({
  paper,
  detailPath = "/student-publication",
  onRemove,
}) {
  const paperDetailPath = getBookmarkDetailPath(detailPath, paper);
  return (
    <article className="bookmark-paper-card">
      <a
        className="bookmark-title-link"
        href={paperDetailPath}
        onClick={navTo(paperDetailPath)}
      >
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
      <a
        className="bookmark-open"
        href={paperDetailPath}
        onClick={navTo(paperDetailPath)}
      >
        Open detail
        <MiniIcon path="M9 5l7 7-7 7" />
      </a>
      {onRemove ? (
        <button
          type="button"
          className="bookmark-remove"
          onClick={() => onRemove(paper)}
        >
          Remove
        </button>
      ) : null}
    </article>
  );
}

function FollowSuggestionsSection() {
  const [followedKeywordIds, setFollowedKeywordIds] = React.useState([]);
  const { data: suggestions } = useApiResource("/api/follows/suggestions", [], {
    auth: true,
    select: (payload) => (Array.isArray(payload) ? payload : []),
  });

  const followKeyword = (keyword) => {
    if (!isBackendNumericId(keyword.id)) return;
    setFollowedKeywordIds((current) => [...new Set([...current, keyword.id])]);
    apiFetch(`/api/follows/keyword/${keyword.id}`, {
      method: "POST",
      auth: true,
    }).catch(() => {
      setFollowedKeywordIds((current) =>
        current.filter((id) => id !== keyword.id),
      );
    });
  };

  if (!suggestions.length) return null;

  return (
    <div
      className="bookmark-keyword-suggestions"
      aria-label="Suggested keywords"
    >
      {suggestions.slice(0, 6).map((keyword) => {
        const followed = followedKeywordIds.includes(keyword.id);
        return (
          <article className="bookmark-keyword-card" key={keyword.id}>
            <div className="card-header">
              <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
              <h2>{keyword.term || keyword.Term}</h2>
            </div>
            <div className="card-body">
              <span>Suggested by backend</span>
              <span className="trend-badge positive">
                {followed ? "Following" : "New"}
              </span>
            </div>
            <button
              type="button"
              className="bookmark-remove"
              disabled={followed}
              onClick={() => followKeyword(keyword)}
            >
              {followed ? "Followed" : "Follow keyword"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function FollowJournalSuggestionsSection({
  detailPath = "/student-publication",
}) {
  const { t } = useTranslation();
  const [followedJournalIds, setFollowedJournalIds] = React.useState([]);
  const { data: journals } = useApiResource("/api/journals", [], {
    select: unwrapList,
  });

  const followJournal = (journal) => {
    if (!isBackendNumericId(journal.id)) return;
    setFollowedJournalIds((current) => [...new Set([...current, journal.id])]);
    apiFetch(`/api/follows/journal/${journal.id}`, {
      method: "POST",
      auth: true,
    }).catch(() => {
      setFollowedJournalIds((current) =>
        current.filter((id) => id !== journal.id),
      );
    });
  };

  if (!journals.length) return null;

  return (
    <div
      className="bookmark-keyword-suggestions"
      aria-label="Suggested journals"
    >
      {journals.slice(0, 4).map((journal) => {
        const id = journal.id ?? journal.Id;
        const name = journal.name || journal.Name || "Indexed Journal";
        const followed = followedJournalIds.includes(id);
        return (
          <article className="bookmark-journal-card" key={id || name}>
            <div className="card-header">
              <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
              <h2>{name}</h2>
            </div>
            <div className="card-body">
              <span>Backend journal</span>
              <span className="status-badge">
                {followed ? "Following" : "Suggested"}
              </span>
            </div>
            <button
              type="button"
              className="bookmark-remove"
              disabled={followed}
              onClick={() => followJournal({ ...journal, id })}
            >
              {followed ? "Followed" : "Follow journal"}
            </button>
            <a href={detailPath} onClick={navTo(detailPath)}>
              {t("bookmarks.viewJournal")} -&gt;
            </a>
          </article>
        );
      })}
    </div>
  );
}

function FollowTopicSuggestionsSection() {
  const [followedIds, setFollowedIds] = React.useState([]);
  const { data: topics } = useApiResource("/api/follows/topics", [], {
    auth: true,
    select: unwrapList,
  });
  const followTopic = async (topic) => {
    const id = topic.id ?? topic.Id;
    if (!isBackendNumericId(id)) return;
    setFollowedIds((current) => [...new Set([...current, id])]);
    try {
      await apiFetch(`/api/follows/topic/${id}`, {
        method: "POST",
        auth: true,
      });
    } catch {
      setFollowedIds((current) => current.filter((item) => item !== id));
    }
  };
  if (!topics.length) return null;
  return (
    <div
      className="bookmark-keyword-suggestions"
      aria-label="Suggested research topics"
    >
      {topics.slice(0, 8).map((topic) => {
        const id = topic.id ?? topic.Id;
        const name = topic.name || topic.Name;
        const followed = followedIds.includes(id);
        return (
          <article className="bookmark-topic-card" key={id}>
            <div className="card-header">
              <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
              <h2>{name}</h2>
            </div>
            <p>{topic.description || topic.Description || "Research topic"}</p>
            <button
              type="button"
              className="bookmark-remove"
              disabled={followed}
              onClick={() => followTopic(topic)}
            >
              {followed ? "Following" : "Follow topic"}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function EmptyBookmarkState() {
  return (
    <div
      className="empty-state"
      style={{ textAlign: "center", padding: "2rem" }}
    >
      <p>No bookmarked publications yet.</p>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#888" }}>
        💡 Hãy thêm bookmark bằng cách tìm kiếm bài báo và nhấn nút bookmark
      </p>
    </div>
  );
}

function BookmarksPage({ role = "student" }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("Publications");
  const [removedBookmarkKeys, setRemovedBookmarkKeyState] = React.useState(() =>
    getRemovedBookmarkKeys(),
  );
  const [localBookmarkedPapers] = React.useState(() => getLocalBookmarks());

  const { data: backendBookmarkedPapers } = useApiResource(
    "/api/bookmarks",
    [],
    {
      auth: true,
      select: (payload) =>
        unwrapList(payload).map((paper) => {
          const mapped = mapPublicationForCard(paper);
          return {
            id: mapped.id,
            title: mapped.title,
            excerpt: mapped.excerpt,
            date: String(mapped.year || "N/A"),
            citations: mapped.citations,
            impact: mapped.tags?.[0] || "Indexed",
          };
        }),
    },
  );

  // Search results from external academic sources are saved locally because
  // they do not have a numeric publication ID yet. All three academic roles
  // use this page, so combine those items with account-backed bookmarks.
  const bookmarkPapersForUi = mergeBookmarkLists(
    backendBookmarkedPapers,
    localBookmarkedPapers,
  ).filter(
    (paper) => !removedBookmarkKeys.includes(getBookmarkKey(paper)),
  );
  const { data: followedItems } = useApiResource("/api/follows", [], {
    auth: true,
    select: unwrapList,
  });
  const followedKeywords = followedItems
    .filter((item) =>
      String(item.followType || item.FollowType).includes("Keyword"),
    )
    .map((item) => ({
      id: item.id || item.Id || item.followTargetId || item.FollowTargetId,
      name:
        item.followTargetName ||
        item.FollowTargetName ||
        `Keyword ${item.followTargetId || item.FollowTargetId || ""}`.trim(),
      count: "Followed keyword",
      trend: "Tracked",
    }));
  const followedJournals = followedItems
    .filter((item) =>
      String(item.followType || item.FollowType).includes("Journal"),
    )
    .map((item) => ({
      id: item.id || item.Id || item.followTargetId || item.FollowTargetId,
      name:
        item.followTargetName ||
        item.FollowTargetName ||
        `Journal ${item.followTargetId || item.FollowTargetId || ""}`.trim(),
      impactFactor: "N/A",
      status: "Active alerts",
    }));
  const bookmarkTopicsForUi = followedItems
    .filter((item) =>
      String(item.followType || item.FollowType).includes("Topic"),
    )
    .map((item) => ({
      name: item.followTargetName || item.FollowTargetName || "Research topic",
      tracked: "Followed topic",
      activity: "Tracked",
    }));
  const handleRemoveBookmark = async (paper) => {
    setRemovedBookmarkKeyState(markBookmarkRemoved(paper));

    if (isBackendNumericId(paper.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${paper.id}`, {
        method: "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };
  const isAcademic = role === "researcher" || role === "lecturer";
  const rolePrefix = role === "lecturer" ? "lecturer" : "researcher";
  const detailPath = isAcademic
    ? getAcademicPath("/researcher-publication", rolePrefix)
    : "/student-publication";
  const dashboardPath = isAcademic
    ? getAcademicPath("/researcher-dashboard", rolePrefix)
    : "/student-dashboard";

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-bookmarks", rolePrefix)}
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
              {bookmarkPapersForUi.length ? (
                bookmarkPapersForUi.map((paper) => (
                  <BookmarkPaperCard
                    paper={paper}
                    detailPath={detailPath}
                    onRemove={handleRemoveBookmark}
                    key={paper.title}
                  />
                ))
              ) : (
                <EmptyBookmarkState />
              )}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              <FollowSuggestionsSection />
              {followedKeywords.map((keyword) => (
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
              <FollowJournalSuggestionsSection detailPath={detailPath} />
              {followedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.impactFactor")}:{" "}
                      <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewJournal")} -&gt;
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
              <FollowTopicSuggestionsSection />
              {bookmarkTopicsForUi.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.tracked")}: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewTopic")} -&gt;
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
              <a
                href="/student-dashboard"
                onClick={navTo("/student-dashboard")}
              >
                Dashboard
              </a>
              <span>&gt;</span>
              <strong>Bookmarks</strong>
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
              {bookmarkPapersForUi.length ? (
                bookmarkPapersForUi.map((paper) => (
                  <BookmarkPaperCard
                    paper={paper}
                    detailPath={detailPath}
                    onRemove={handleRemoveBookmark}
                    key={paper.title}
                  />
                ))
              ) : (
                <EmptyBookmarkState />
              )}
            </section>
          )}

          {activeTab === "Keywords" && (
            <section
              className="bookmark-keyword-list"
              aria-label="Bookmarked keywords"
            >
              <FollowSuggestionsSection />
              {followedKeywords.map((keyword) => (
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
              <FollowJournalSuggestionsSection detailPath={detailPath} />
              {followedJournals.map((journal) => (
                <article className="bookmark-journal-card" key={journal.name}>
                  <div className="card-header">
                    <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />
                    <h2>{journal.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.impactFactor")}:{" "}
                      <strong>{journal.impactFactor}</strong>
                    </span>
                    <span className="status-badge">{journal.status}</span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewJournal")} -&gt;
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
              <FollowTopicSuggestionsSection />
              {bookmarkTopicsForUi.map((topic) => (
                <article className="bookmark-topic-card" key={topic.name}>
                  <div className="card-header">
                    <MiniIcon path="M12 4.5a5 5 0 0 0-2.5 9.35v2.15h5v-2.15A5 5 0 0 0 12 4.5Z" />
                    <h2>{topic.name}</h2>
                  </div>
                  <div className="card-body">
                    <span>
                      {t("bookmarks.tracked")}: <strong>{topic.tracked}</strong>
                    </span>
                    <span
                      className={`activity-badge ${topic.activity.includes("High") ? "high" : topic.activity.includes("Medium") ? "medium" : "low"}`}
                    >
                      {topic.activity}
                    </span>
                  </div>
                  <a href={detailPath} onClick={navTo(detailPath)}>
                    {t("bookmarks.viewTopic")} -&gt;
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

function NotificationFilterPanel({
  activeFilters,
  onChangeFilter,
  totalCount = 0,
  unreadCount = 0,
}) {
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
              <button
                type="button"
                className={
                  activeFilters[groupIndex] === option.label ? "active" : ""
                }
                key={option.label}
                onClick={() => onChangeFilter(groupIndex, option.label)}
              >
                <i aria-hidden="true"></i>
                <span>{option.label}</span>
                {groupIndex === 0 ? (
                  <b>{option.label === "Unread" ? unreadCount : totalCount}</b>
                ) : null}
              </button>
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
          <span className="text-link" key={`${index}-${subIndex}`}>
            {subPart}
          </span>
        );
      }
      return subPart;
    });
  });
}

function NotificationCard({ item, onOpen, onToggleBookmark }) {
  const displayTitle = String(item.title || "Notification")
    .replace(
      /^(NOTICE|REJECTED|REVIEW|NEW RESEARCH|SYNC COMPLETE|TREND SPIKE):\s*/i,
      "",
    )
    .trim();

  return (
    <article
      role="button"
      tabIndex={0}
      className={`notification-card ${item.tone} ${item.unread ? "unread" : ""}`}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
    >
      <div className={`notification-icon ${item.tone}`}>
        <MiniIcon path={item.icon} />
      </div>
      <div className="notification-body">
        <div className="notification-card-heading">
          <div className="notification-source">
            <span className={item.fromAdmin ? "admin" : ""}>
              {item.source || "ScholarTrend System"}
            </span>
            {item.unread ? <b>New</b> : null}
          </div>
          <time>{item.time}</time>
        </div>
        <div className="notification-meta">
          <span>{item.type}</span>
        </div>
        <h3>{displayTitle}</h3>
        <p>{renderFormattedText(item.text)}</p>
      </div>
      {item.bookmarked ? (
        <button
          type="button"
          className="notification-bookmark"
          aria-label="Save notification"
          onClick={(event) => {
            event.stopPropagation();
            onToggleBookmark(item.id);
          }}
        >
          <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
        </button>
      ) : (
        <span className="notification-open-indicator" aria-hidden="true">
          <MiniIcon path="M9 5l7 7-7 7" />
        </span>
      )}
    </article>
  );
}

function NotificationDetailPanel({ item, route, onClose }) {
  if (!item) return null;

  const canOpenRoute = Boolean(route);

  return (
    <div
      className="notification-detail-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-detail-title"
      onClick={onClose}
    >
      <section
        className={`notification-detail-panel ${item.tone || "gray"}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="notification-detail-header">
          <div className={`notification-icon ${item.tone || "gray"}`}>
            <MiniIcon path={item.icon} />
          </div>
          <div>
            <div className="notification-detail-source">
              <span className={item.fromAdmin ? "admin" : ""}>
                {item.source || "ScholarTrend System"}
              </span>
              <b>{item.type}</b>
            </div>
            <h2 id="notification-detail-title">
              {item.title || "Notification"}
            </h2>
            <time>{item.time}</time>
          </div>
          <button
            type="button"
            className="notification-detail-close"
            aria-label="Close notification detail"
            onClick={onClose}
          >
            <MiniIcon path="M6 6l12 12M18 6 6 18" />
          </button>
        </header>

        <div className="notification-detail-body">
          <p>{item.text}</p>
        </div>

        <footer className="notification-detail-actions">
          {canOpenRoute ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                goToRoute(route);
              }}
            >
              Open related page
              <MiniIcon path="M9 5l7 7-7 7" />
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

const extraNotificationItems = [
  {
    id: "new-research-regularization",
    type: "NEW PUBLICATION",
    time: "4 days ago",
    title: "NEW RESEARCH:",
    text: 'Dr. Elena Rostova published "Topological Regularization in Deep Autoencoders" in Nature Computational Science.',
    icon: "M7 4.5h8.5L19 8v12H7zM15.5 4.5V8H19M10 12h5M10 15h6M10 18h3M4 7.5v12h3",
    tone: "purple-soft",
    unread: false,
    route: "/researcher-search?view=list",
  },
  {
    id: "system-semantic-sync",
    type: "SYSTEM ALERT",
    time: "5 days ago",
    title: "SYNC COMPLETE:",
    text: "14,200 new publications were successfully synchronized from Semantic Scholar API.",
    icon: "M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8L20 6M17 16.5a6 6 0 0 1-10.2 2.8L4 18",
    tone: "gray",
    unread: false,
    route: "/researcher-trend-tracking",
  },
  {
    id: "trend-single-cell-rna",
    type: "TREND ALERT",
    time: "1 week ago",
    title: "TREND SPIKE:",
    text: 'Keyword "Single-cell RNA" citation velocity increased by 28% in computational biology journals.',
    icon: "M4 17.5 9 12l3.2 2.8L20 6.5M17 6.5h3v3M5 20h14M7 16v4M12 14v6M17 11v9",
    tone: "green",
    unread: false,
    route: "/researcher-trend-tracking",
  },
];

const getNotificationTypeLabel = (type) => {
  const normalized = String(type || "SYSTEM").toUpperCase();
  if (normalized === "NEW_PUBLICATION") return "PUBLICATION NOTICE";
  if (normalized === "PLAN_UPDATE") return "PLAN UPDATE";
  if (normalized === "SYSTEM") return "SYSTEM ALERT";
  return normalized.replaceAll("_", " ");
};

const mapBackendNotificationForUi = (item, role) => ({
  id: item.id,
  type: getNotificationTypeLabel(item.notificationType),
  time: item.createdAt ? new Date(item.createdAt).toLocaleString() : "Just now",
  title: item.title || "NOTICE:",
  text: item.message || "",
  icon: "M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4",
  tone: item.isRead ? "gray" : "green",
  unread: !item.isRead,
  source: item.batchId ? "ScholarTrend Admin" : "ScholarTrend System",
  fromAdmin: Boolean(item.batchId),
  route:
    item.route ||
    `/${
      role === "lecturer"
        ? "lecturer"
        : role === "researcher"
          ? "researcher"
          : "student"
    }-search?view=list`,
});

function NotificationsPage({ role = "student" }) {
  const acknowledgedNotificationIds = React.useRef(new Set());
  const { data: loadedBackendNotifications } = useApiResource(
    "/api/notifications",
    [],
    {
      auth: true,
      select: (payload) =>
        unwrapList(payload).map((item) =>
          mapBackendNotificationForUi(item, role),
        ),
    },
  );
  const [backendNotifications, setBackendNotifications] = React.useState([]);
  React.useEffect(() => {
    setBackendNotifications(loadedBackendNotifications);
  }, [loadedBackendNotifications]);
  React.useEffect(() => {
    backendNotifications.forEach((item) => {
      const id = Number(item.id);
      if (!Number.isInteger(id) || acknowledgedNotificationIds.current.has(id))
        return;
      acknowledgedNotificationIds.current.add(id);
      apiFetch(`/api/notifications/${id}/ack`, {
        method: "POST",
        auth: true,
      }).catch(() => acknowledgedNotificationIds.current.delete(id));
    });
  }, [backendNotifications]);
  const [notifications, setNotifications] = React.useState([]);
  const [hasMore, setHasMore] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState({
    0: "All Notifications",
    1: "Any Time",
  });
  const [selectedNotification, setSelectedNotification] = React.useState(null);
  const isResearcher = role === "researcher" || role === "lecturer";
  const isAcademic = isResearcher;
  const rolePrefix =
    role === "lecturer"
      ? "lecturer"
      : role === "researcher"
        ? "researcher"
        : "student";
  const roleNotificationsPath = `/${rolePrefix}-notifications`;

  React.useEffect(() => {
    setNotifications(backendNotifications);
    setHasMore(false);
  }, [backendNotifications]);

  const handleLoadMore = () => {
    setHasMore(false);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, unread: false })),
    );
    try {
      await apiFetch("/api/notifications/read-all", {
        method: "PUT",
        auth: true,
      });
    } catch {
      // Keep local read state when user is browsing without a backend token.
    }
  };

  const handleChangeFilter = (groupIndex, value) => {
    setActiveFilters((current) => ({
      ...current,
      [groupIndex]: value,
    }));
  };

  const resolveNotificationRoute = (item) => {
    if (item.route) {
      const recipientSafeRoute = getSafeRecipientRoute(item.route, rolePrefix);
      if (
        /^\/(student|lecturer|researcher)-notifications/.test(
          recipientSafeRoute,
        )
      ) {
        return roleNotificationsPath;
      }
      return getAcademicPath(recipientSafeRoute, rolePrefix);
    }
    if (rolePrefix === "student") {
      if (item.type.includes("SYSTEM")) return "/student-notifications";
      if (item.type.includes("TREND")) return "/student-search";
      return "/student-search";
    }

    return getAcademicPath(item.route || "/researcher-search", rolePrefix);
  };

  const handleOpenNotification = (item) => {
    const openedNotification = { ...item, unread: false };
    setSelectedNotification(openedNotification);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === item.id
          ? { ...notification, unread: false }
          : notification,
      ),
    );
    const backendNotificationId = Number(item.id);
    if (Number.isInteger(backendNotificationId)) {
      apiFetch(`/api/notifications/${backendNotificationId}/read`, {
        method: "PUT",
        auth: true,
      }).catch(() => {});
    }
  };

  const handleToggleBookmark = (itemId) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === itemId
          ? { ...notification, bookmarked: !notification.bookmarked }
          : notification,
      ),
    );
  };

  const filteredNotifications = notifications.filter((item) => {
    const readFilter = activeFilters[0];
    if (readFilter === "Unread" && !item.unread) return false;

    const timeFilter = activeFilters[1];
    if (timeFilter === "Today") {
      return (
        item.time === "Just now" ||
        item.time.includes("mins") ||
        item.time.includes("hours")
      );
    }
    if (timeFilter === "This Week") {
      return !item.time.includes("week");
    }

    return true;
  });
  const selectedRoute = selectedNotification
    ? resolveNotificationRoute(selectedNotification)
    : "";
  const detailRoute =
    selectedRoute && selectedRoute !== roleNotificationsPath
      ? selectedRoute
      : "";

  const pageContent = (
    <div
      className={
        isAcademic
          ? "researcher-notifications-content notifications-content"
          : "student-content notifications-content"
      }
    >
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>
            Messages from ScholarTrend Admin, editorial reviews, and system
            updates.
          </p>
        </div>
        <div className="notifications-header-actions">
          <div
            className="notification-summary"
            aria-label="Notification summary"
          >
            <span>
              <b>{notifications.filter((item) => item.unread).length}</b> unread
            </span>
            <span>
              <b>{notifications.length}</b> total
            </span>
          </div>
          <button
            type="button"
            className="mark-read-button"
            onClick={handleMarkAllRead}
            disabled={!notifications.some((item) => item.unread)}
          >
            <MiniIcon path="M5 12.5 9 16.5 19 6.5" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="notifications-layout">
        <NotificationFilterPanel
          activeFilters={activeFilters}
          onChangeFilter={handleChangeFilter}
          totalCount={notifications.length}
          unreadCount={notifications.filter((item) => item.unread).length}
        />
        <section className="notification-list" aria-label="Notifications list">
          {filteredNotifications.length ? (
            filteredNotifications.map((item, index) => (
              <NotificationCard
                item={item}
                key={`${item.type}-${item.time}-${index}`}
                onOpen={handleOpenNotification}
                onToggleBookmark={handleToggleBookmark}
              />
            ))
          ) : (
            <div className="notification-empty-state">
              <div className="notification-icon gray">
                <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
              </div>
              <h2>No notifications found</h2>
              <p>Try another filter or check back later.</p>
            </div>
          )}
          {hasMore ? (
            <button
              type="button"
              className="load-more-button"
              onClick={handleLoadMore}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                cursor: "pointer",
                outline: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  pointerEvents: "none",
                }}
              >
                Load More
              </span>
            </button>
          ) : filteredNotifications.length ? (
            <div className="no-more-notifications">You are all caught up</div>
          ) : null}
        </section>
      </div>
      <NotificationDetailPanel
        item={selectedNotification}
        route={detailRoute}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );

  if (isResearcher) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-notifications", rolePrefix)}
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
              <a
                href="/student-dashboard"
                onClick={navTo("/student-dashboard")}
              >
                Dashboard
              </a>
              <span>&gt;</span>
              <strong>Notifications</strong>
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

export {
  BookmarkPaperCard,
  FollowSuggestionsSection,
  FollowJournalSuggestionsSection,
  BookmarksPage,
  NotificationFilterPanel,
  renderFormattedText,
  NotificationCard,
  NotificationDetailPanel,
  extraNotificationItems,
  getNotificationTypeLabel,
  mapBackendNotificationForUi,
  NotificationsPage,
};
