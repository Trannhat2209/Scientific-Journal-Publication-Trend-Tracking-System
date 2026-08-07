// Generated module from the former App.jsx.
import React from "react";
import DataProvenance from "../../components/academic/DataProvenance";
import { MiniIcon, apiFetch, formatCount, getAcademicPath, getSearchParam, isBackendNumericId, mapPublicationDetailForUi, unwrapList, useApiResource } from "../../app/core.jsx";
import { ResearcherShell, StudentSidebar, StudentTopbar } from "./shell.jsx";

function ImpactAnalyticsCard({ keywordId, topicName }) {
  const [trackedKeywordId, setTrackedKeywordId] = React.useState(null);
  const [trackStatus, setTrackStatus] = React.useState("idle");
  const [trackMessage, setTrackMessage] = React.useState("");
  const canTrack = isBackendNumericId(keywordId);
  const isTracked = Number(trackedKeywordId) === Number(keywordId);

  React.useEffect(() => {
    let cancelled = false;
    setTrackedKeywordId(null);
    setTrackMessage("");
    if (!canTrack) return () => {};

    apiFetch("/api/follows", { auth: true })
      .then((follows) => {
        if (cancelled || !Array.isArray(follows)) return;
        const matchingFollow = follows.find(
          (follow) =>
            String(follow.followType || "").toLowerCase() === "keyword" &&
            Number(follow.followTargetId) === Number(keywordId),
        );
        setTrackedKeywordId(matchingFollow?.followTargetId || null);
      })
      .catch((error) => {
        if (!cancelled) setTrackMessage(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [canTrack, keywordId]);

  const toggleTopicTracking = async () => {
    if (!canTrack || trackStatus === "saving") return;
    setTrackStatus("saving");
    setTrackMessage("");
    try {
      await apiFetch(`/api/follows/keyword/${keywordId}`, {
        method: isTracked ? "DELETE" : "POST",
        auth: true,
      });
      setTrackedKeywordId(isTracked ? null : Number(keywordId));
      setTrackMessage(
        isTracked
          ? `${topicName || "Topic"} is no longer tracked.`
          : `${topicName || "Topic"} is now being tracked.`,
      );
      setTrackStatus("success");
    } catch (error) {
      setTrackMessage(error.message);
      setTrackStatus("error");
    }
  };

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
      <button
        type="button"
        className={`track-topic${isTracked ? " is-tracked" : ""}`}
        onClick={toggleTopicTracking}
        disabled={!canTrack || trackStatus === "saving"}
        aria-pressed={isTracked}
        title={!canTrack ? "This publication does not have a trackable keyword." : undefined}
      >
        <MiniIcon path="M18 16H6l1.4-2.2V10a4.6 4.6 0 0 1 9.2 0v3.8L18 16ZM10 19h4" />
        {trackStatus === "saving"
          ? "Saving..."
          : isTracked
            ? "Topic Tracked"
            : "Track this Topic"}
      </button>
      {trackMessage ? (
        <p className={`track-topic-status ${trackStatus}`} role="status">
          {trackMessage}
        </p>
      ) : null}
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

function ExtractedTopicsCard({ topics = [] }) {
  return (
    <aside className="topics-card">
      <h2>Extracted Topics</h2>
      <div>
        {topics.length ? (
          topics.map((topic) => <span key={topic}>{topic}</span>)
        ) : (
          <span>No indexed topics</span>
        )}
      </div>
    </aside>
  );
}

function StudentPublicationDetailPage({ role = "student" }) {
  const [activeTab, setActiveTab] = React.useState("Abstract");
  const [actionMessage, setActionMessage] = React.useState("");
  const [bookmarked, setBookmarked] = React.useState(false);
  const isAcademic = role === "researcher" || role === "lecturer";
  const rolePrefix = role === "lecturer" ? "lecturer" : "researcher";
  const publicationId = getSearchParam("id");
  const selectedGraphPublication = React.useMemo(() => {
    try {
      const parsed = JSON.parse(
        window.sessionStorage.getItem(
          "scholartrend.selectedGraphPublication",
        ) || "null",
      );
      return parsed &&
        (!publicationId || String(parsed.id) === String(publicationId))
        ? parsed
        : null;
    } catch {
      return null;
    }
  }, [publicationId]);
  const graphPublicationFallback = React.useMemo(
    () => mapPublicationDetailForUi(selectedGraphPublication || {}),
    [selectedGraphPublication],
  );
  const publicationApiPath = publicationId
    ? `/api/publications/${encodeURIComponent(publicationId)}`
    : "/api/publications/search?page=1&pageSize=1";
  const { data: publicationDetail } = useApiResource(
    publicationApiPath,
    graphPublicationFallback,
    {
      clearOnLoad: true,
      select: (payload) => {
        const mapped = publicationId
          ? mapPublicationDetailForUi(payload)
          : mapPublicationDetailForUi({ publication: unwrapList(payload)[0] });
        if (
          selectedGraphPublication &&
          String(mapped.id || "") !== String(selectedGraphPublication.id || "")
        ) {
          return graphPublicationFallback;
        }
        return mapped;
      },
    },
  );
  const publicationBaseRoute = isAcademic
    ? getAcademicPath("/researcher-publication", rolePrefix)
    : "/student-publication";
  const publicationRoute = `${publicationBaseRoute}${
    publicationDetail.id
      ? `?id=${encodeURIComponent(publicationDetail.id)}`
      : ""
  }`;
  const publicationSourceUrl =
    publicationDetail.sourceUrl ||
    (publicationDetail.doi
      ? `https://doi.org/${encodeURIComponent(publicationDetail.doi)}`
      : "");
  const bookmarkPublication = async () => {
    if (!isBackendNumericId(publicationDetail.id)) {
      setActionMessage("This publication must be indexed before it can be bookmarked.");
      return;
    }
    try {
      await apiFetch(`/api/bookmarks/${publicationDetail.id}`, { method: bookmarked ? "DELETE" : "POST", auth: true });
      setBookmarked((value) => !value);
      setActionMessage(bookmarked ? "Bookmark removed." : "Publication bookmarked.");
    } catch (error) { setActionMessage(error.message); }
  };
  const sharePublication = async () => {
    const shareData = { title: publicationDetail.title, url: publicationSourceUrl || window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
      setActionMessage("Publication link shared or copied.");
    } catch (error) { if (error.name !== "AbortError") setActionMessage("Unable to share this publication."); }
  };
  const copyCitation = async () => {
    const citation = `${publicationDetail.authors.join(", ")} (${publicationDetail.year}). ${publicationDetail.title}. ${publicationDetail.journalName}.${publicationDetail.doi ? ` https://doi.org/${publicationDetail.doi}` : ""}`;
    try { await navigator.clipboard.writeText(citation); setActionMessage("Citation copied."); }
    catch { setActionMessage(citation); }
  };
  const relatedForUi = publicationDetail.relatedPublications.length
    ? publicationDetail.relatedPublications.map((paper) => ({
        title: paper.title,
        authors: Array.isArray(paper.authors)
          ? paper.authors.join(", ")
          : "Related authors",
        meta: `${paper.year || "N/A"} - ${paper.journalName || "Scientific Journal"}`,
        stats: `${formatCount(paper.citationCount)} citations`,
      }))
    : [];

  const pageContent = (
    <div
      className={`${isAcademic ? "researcher-detail-content" : "student-content"} detail-content`}
    >
      <div className="detail-layout">
        <section className="detail-main-column">
          <article className="publication-detail-hero">
            <div className="detail-hero-actions">
              <span className="article-type">Journal Article</span>
              <div>
                <button type="button" aria-label="Bookmark article" className={bookmarked ? "active" : ""} onClick={bookmarkPublication}>
                  <MiniIcon path="M6 4.5h12v15L12 16l-6 3.5v-15Z" />
                </button>
                <button type="button" aria-label="Share article" onClick={sharePublication}>
                  <MiniIcon path="M18 8a3 3 0 1 0-2.8-4M6 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.3 6.8 8.7 15.2M8.7 8.8l6.6 3.7" />
                </button>
                <button type="button" className="cite-button" onClick={copyCitation}>
                  {formatCount(publicationDetail.citationCount)} Cite
                </button>
              </div>
            </div>

            <h1>{publicationDetail.title}</h1>
            <p className="detail-authors">
              <strong>
                {publicationDetail.authors[0] || "Unknown author"}
              </strong>
              {publicationDetail.authors.length > 1
                ? `, ${publicationDetail.authors.slice(1).join(", ")}`
                : ""}
            </p>
            <p className="detail-journal">
              <MiniIcon path="M4 5.5c2.8-.8 5.3-.4 8 1.3v12c-2.7-1.7-5.2-2.1-8-1.3v-12ZM12 6.8c2.7-1.7 5.2-2.1 8-1.3v12c-2.8-.8-5.3-.4-8 1.3" />{" "}
              {publicationDetail.journalName} ({publicationDetail.year})
            </p>

            <div className="detail-meta-strip">
              <span>
                <MiniIcon path="M4 14.5 9 10l3.2 2.7L20 5.5M17 5.5h3v3" />{" "}
                {formatCount(publicationDetail.citationCount)}
                Citations
              </span>
              {publicationSourceUrl ? (
                <a href={publicationSourceUrl} target="_blank" rel="noreferrer">
                  Source: {publicationDetail.sourceApi || "Original"} -&gt;
                </a>
              ) : (
                <span>Source: Not available</span>
              )}
            </div>
            {actionMessage ? <p className="paper-save-status" role="status">{actionMessage}</p> : null}
            <DataProvenance
              source={publicationDetail.sourceApi || publicationDetail.journalName}
              sourceUrl={publicationSourceUrl}
              syncedAt={publicationDetail.syncedAt}
            />
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
                <p>{publicationDetail.abstract}</p>

                <h3>Key Findings</h3>
                <ul>
                  <li>Indexed in {publicationDetail.journalName}.</li>
                  <li>Published in {publicationDetail.year}.</li>
                  <li>
                    Cited {formatCount(publicationDetail.citationCount)} times.
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
                  {(publicationDetail.keywords.length
                    ? publicationDetail.keywords
                    : ["Publication"]
                  ).map((keyword, index) => (
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
                      key={keyword}
                    >
                      <MiniIcon path="M5 7h14M5 12h14M5 17h14" />
                      <strong>{keyword}</strong>
                      {index < 2 ? (
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "12px",
                          }}
                        >
                          (Tracked)
                        </span>
                      ) : null}
                    </span>
                  ))}
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
                        Institute of Advanced Analytics - Computational Biology
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
                        University of Applied Sciences - Deep Learning Lab
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
                        Seoul Institute of Technology - Bioinformatics Research
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
                  {JSON.stringify(
                    {
                      id: publicationDetail.id,
                      title: publicationDetail.title,
                      authors: publicationDetail.authors,
                      journal: publicationDetail.journalName,
                      year: publicationDetail.year,
                      doi: publicationDetail.doi,
                      citations: publicationDetail.citationCount,
                      keywords: publicationDetail.keywords,
                    },
                    null,
                    2,
                  )}
                </pre>
              </div>
            )}
          </article>

          <section className="related-section">
            <h2>Related Publications</h2>
            <div className="related-list">
              {relatedForUi.length ? relatedForUi.map((paper) => (
                <article className="related-card" key={paper.title}>
                  <div className="related-icon">
                    <MiniIcon path="M6 4.5h12v15H6zM9 8h6M9 11h6M9 14h4" />
                  </div>
                  <div>
                    <h3>{paper.title}</h3>
                    <p>
                      {paper.authors} - {paper.meta}
                    </p>
                    <span>{paper.stats}</span>
                  </div>
                </article>
              )) : <p>No related publications are indexed for this paper yet.</p>}
            </div>
          </section>
        </section>

        <section className="detail-side-column">
          <ImpactAnalyticsCard
            keywordId={publicationDetail.keywordIds[0]}
            topicName={publicationDetail.keywords[0]}
          />
          <ExtractedTopicsCard topics={publicationDetail.keywords} />
        </section>
      </div>
    </div>
  );

  if (isAcademic) {
    return (
      <ResearcherShell
        activeRoute={getAcademicPath("/researcher-search", rolePrefix)}
        topbar="publication"
        pageClassName="researcher-publication-page"
        mainClassName="researcher-publication-main"
        publicationTitle={publicationDetail.title}
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

export { ImpactAnalyticsCard, ExtractedTopicsCard, StudentPublicationDetailPage };
