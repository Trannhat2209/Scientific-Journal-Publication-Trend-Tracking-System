// Generated module from the former App.jsx.
import React from "react";
import { apiFetch, buildExternalSourceLinks, buildPaperDocxData, downloadDocxFile, formatCount, getCurrentAccountPlan, getLocalBookmarks, getPolicyScopedSearchAccuracy, getPublishedPublications, getSearchParam, getSearchTerms, getStoredAuth, hasLocalBookmark, isBackendNumericId, mapPublicationForCard, mapPublishedPublicationForCard, matchesSearchTerms, mergePublicationsByIdOrTitle, navTo, removeLocalBookmark, slugifyFilename, unwrapList, upsertLocalBookmark, useApiResource } from "../../app/core.jsx";
import { StudentSidebar, StudentTopbar } from "./shell.jsx";
import { SearchFilterPanel, SearchResultCard } from "./research.jsx";

function StudentSearchPage() {
  const [localBookmarks, setLocalBookmarkState] = React.useState(() =>
    getLocalBookmarks(),
  );
  const [bookmarkMessage, setBookmarkMessage] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [filters, setFilters] = React.useState(() => ({
    keyword: getSearchParam("q") || "",
    yearFrom: "2010",
    yearTo: "2026",
    source: "All Sources",
    journal: "",
    researchTopic: "",
    minCitations: "",
    maxCitations: "",
    sortBy: "relevance",
  }));
  const [debouncedFilters, setDebouncedFilters] = React.useState(filters);
  React.useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedFilters(filters),
      350,
    );
    return () => window.clearTimeout(timeoutId);
  }, [filters]);
  React.useEffect(() => {
    const syncUrlQuery = () => {
      const urlKeyword = getSearchParam("q") || "";
      setFilters((current) =>
        current.keyword === urlKeyword
          ? current
          : { ...current, keyword: urlKeyword },
      );
      setPage(1);
    };

    window.addEventListener("scholartrend:navigate", syncUrlQuery);
    window.addEventListener("popstate", syncUrlQuery);
    syncUrlQuery();
    return () => {
      window.removeEventListener("scholartrend:navigate", syncUrlQuery);
      window.removeEventListener("popstate", syncUrlQuery);
    };
  }, []);
  const accountPlan = getCurrentAccountPlan();
  const searchApiPath = React.useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "10",
      sortBy: debouncedFilters.sortBy || "relevance",
    });
    const keyword = debouncedFilters.keyword.trim();
    if (keyword) params.set("keyword", keyword);
    if (debouncedFilters.yearFrom)
      params.set("yearFrom", debouncedFilters.yearFrom);
    if (debouncedFilters.yearTo) params.set("yearTo", debouncedFilters.yearTo);
    if (debouncedFilters.source && debouncedFilters.source !== "All Sources") {
      params.set("source", debouncedFilters.source);
    }
    if (debouncedFilters.journal.trim()) params.set("journal", debouncedFilters.journal.trim());
    if (debouncedFilters.researchTopic.trim()) params.set("researchTopic", debouncedFilters.researchTopic.trim());
    if (debouncedFilters.minCitations) params.set("minCitations", debouncedFilters.minCitations);
    if (debouncedFilters.maxCitations) params.set("maxCitations", debouncedFilters.maxCitations);
    return `/api/publications/search?${params.toString()}`;
  }, [
    page,
    debouncedFilters.keyword,
    debouncedFilters.yearFrom,
    debouncedFilters.yearTo,
    debouncedFilters.source,
    debouncedFilters.sortBy,
    debouncedFilters.journal,
    debouncedFilters.researchTopic,
    debouncedFilters.minCitations,
    debouncedFilters.maxCitations,
  ]);
  const { data: searchPageData, status: searchStatus } = useApiResource(
    searchApiPath,
    { items: [], totalCount: 0, totalPages: 1, page: 1, pageSize: 10 },
    {
      auth: true,
      clearOnLoad: false,
      select: (payload) => ({
        items: unwrapList(payload).map(mapPublicationForCard),
        totalCount: Number(payload?.totalCount ?? payload?.TotalCount ?? 0),
        totalPages: Number(payload?.totalPages ?? payload?.TotalPages ?? 1),
        page: Number(payload?.page ?? payload?.Page ?? page),
        pageSize: Number(payload?.pageSize ?? payload?.PageSize ?? 10),
      }),
    },
  );
  const backendResults = searchPageData.items;
  const publishedSearchResults = React.useMemo(
    () => getPublishedPublications().map(mapPublishedPublicationForCard),
    [],
  );
  const filteredPublishedSearchResults = React.useMemo(() => {
    const keywordTerms = getSearchTerms(filters.keyword);
    const fromYear = Number(filters.yearFrom || 0);
    const toYear = Number(filters.yearTo || 0);
    return publishedSearchResults.filter((result) => {
      const searchableText = [
        result.title,
        result.authors,
        result.abstract,
        result.source,
        ...(Array.isArray(result.tags) ? result.tags : []),
      ].join(" ");
      const matchesKeyword = matchesSearchTerms(searchableText, keywordTerms);
      const year = Number(result.year || 0);
      const matchesYearFrom = !fromYear || !year || year >= fromYear;
      const matchesYearTo = !toYear || !year || year <= toYear;
      const matchesSource =
        !filters.source ||
        filters.source === "All Sources" ||
        result.source === filters.source ||
        result.sourceApi === filters.source ||
        result.journalName === filters.source;
      return (
        matchesKeyword && matchesYearFrom && matchesYearTo && matchesSource
      );
    });
  }, [
    publishedSearchResults,
    filters.keyword,
    filters.yearFrom,
    filters.yearTo,
    filters.source,
  ]);
  // Optimize: Only merge and map saved status, backend already filtered/sorted
  const searchResultsForUi = React.useMemo(() => {
    // Backend already handles filtering and sorting, just merge with published
    const merged = mergePublicationsByIdOrTitle(
      filteredPublishedSearchResults,
      backendResults,
    );

    // Only add UI-specific fields
    return merged.map((result) => ({
      ...result,
      saved: hasLocalBookmark(result, localBookmarks),
      plan: accountPlan.plan,
      searchAccuracy: accountPlan.searchAccuracy,
      displayAccuracy: getPolicyScopedSearchAccuracy(
        result,
        filters.keyword,
        accountPlan.searchAccuracy,
      ),
    }));
  }, [
    backendResults,
    filteredPublishedSearchResults,
    localBookmarks,
    filters.keyword,
    accountPlan.searchAccuracy,
  ]);

  const handleToggleSearchSave = async (result) => {
    const nextSaved = !hasLocalBookmark(result, localBookmarks);
    const nextLocalBookmarks = nextSaved
      ? upsertLocalBookmark(result)
      : removeLocalBookmark(result);
    setLocalBookmarkState(nextLocalBookmarks);
    setBookmarkMessage(
      nextSaved
        ? `Saved "${result.title}" to bookmarks.`
        : `Removed "${result.title}" from bookmarks.`,
    );

    if (isBackendNumericId(result.id) && getStoredAuth().accessToken) {
      apiFetch(`/api/bookmarks/${result.id}`, {
        method: nextSaved ? "POST" : "DELETE",
        auth: true,
      }).catch(() => {});
    }
  };
  const downloadStudentPaper = (result) => {
    if (!result) return;
    downloadDocxFile(
      `${slugifyFilename(result.title)}.docx`,
      buildPaperDocxData(result, filters.keyword),
    );
  };
  const handleChangeFilters = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters({
      keyword: "",
      yearFrom: "2010",
      yearTo: "2026",
      source: "All Sources",
      journal: "",
      researchTopic: "",
      minCitations: "",
      maxCitations: "",
      sortBy: "relevance",
    });
    setPage(1);
  };
  const totalSearchPages = Math.max(1, searchPageData.totalPages || 1);
  const totalSearchCount =
    searchPageData.totalCount || searchResultsForUi.length;
  const emptySourceLinks = React.useMemo(() => {
    const query = filters.keyword.trim();
    if (!query) return [];
    const links = buildExternalSourceLinks({ title: query });
    if (!filters.source || filters.source === "All Sources") return links;
    return links.filter(
      (link) =>
        link.label === filters.source ||
        (filters.source === "Connected Papers" &&
          link.label.includes("Connected Papers")),
    );
  }, [filters.keyword, filters.source]);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalSearchPages) },
    (_, index) => {
      const start = Math.max(1, Math.min(page - 2, totalSearchPages - 4));
      return start + index;
    },
  ).filter((number) => number <= totalSearchPages);

  return (
    <main className="student-app">
      <StudentSidebar activeRoute="/student-search" />
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
              <strong>Search Results</strong>
            </div>
          }
          searchValue={filters.keyword}
          wideSearch
        />

        <div className="student-content search-content">
          <h1 className="search-page-title">Publication Search</h1>
          <div className="search-layout">
            <SearchFilterPanel
              filters={filters}
              onChangeFilters={handleChangeFilters}
              onClearFilters={clearFilters}
            />

            <section
              className="search-results-area"
              aria-label="Publication search results"
            >
              {bookmarkMessage ? (
                <p className="bookmark-save-message" role="status">
                  {bookmarkMessage}{" "}
                  <a
                    href="/student-bookmarks"
                    onClick={navTo("/student-bookmarks")}
                  >
                    Open bookmarks
                  </a>
                </p>
              ) : null}
              <div className="search-results-toolbar">
                <p>
                  {searchStatus === "loading"
                    ? "Loading publications..."
                    : `Found ${formatCount(totalSearchCount)} publications`}
                </p>
                <label>
                  <span>Sort by:</span>
                  <select
                    value={filters.sortBy}
                    onChange={(event) =>
                      handleChangeFilters({ sortBy: event.target.value })
                    }
                  >
                    <option value="relevance">Relevance</option>
                    <option value="year">Publication Year</option>
                    <option value="citations">Citation Count</option>
                  </select>
                </label>
              </div>
              {filters.source === "Connected Papers" ? (
                <p className="bookmark-save-message" role="note">
                  Connected Papers builds a relationship graph from a seed publication. Open a matching paper or use Graph View in the Lecturer/Researcher workspace.
                </p>
              ) : null}

              <div className="search-results-list">
                {searchResultsForUi.length ? (
                  searchResultsForUi.map((result) => (
                    <SearchResultCard
                      result={result}
                      onToggleSave={handleToggleSearchSave}
                      onDownloadPaper={downloadStudentPaper}
                      key={result.title}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p>
                      {searchStatus === "loading"
                        ? "Loading publications..."
                        : "No publications matched your filters."}
                    </p>
                    {searchStatus !== "loading" && emptySourceLinks.length ? (
                      <div
                        className="result-source-links"
                        aria-label="Search external sources"
                      >
                        {emptySourceLinks.map((link) => (
                          <a
                            href={link.href}
                            key={link.label}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open {link.label}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="pagination-row">
                <p>
                  Showing{" "}
                  {searchResultsForUi.length
                    ? (page - 1) * searchPageData.pageSize + 1
                    : 0}
                  -
                  {(page - 1) * searchPageData.pageSize +
                    searchResultsForUi.length}{" "}
                  of {formatCount(totalSearchCount)} results
                </p>
                <nav className="pagination" aria-label="Search result pages">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                  >
                    &lt;
                  </button>
                  {pageNumbers.map((number) => (
                    <button
                      className={number === page ? "active" : ""}
                      type="button"
                      onClick={() => setPage(number)}
                      key={number}
                    >
                      {number}
                    </button>
                  ))}
                  {totalSearchPages > pageNumbers[pageNumbers.length - 1] ? (
                    <span>...</span>
                  ) : null}
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= totalSearchPages}
                    onClick={() =>
                      setPage((current) =>
                        Math.min(totalSearchPages, current + 1),
                      )
                    }
                  >
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

export { StudentSearchPage };
