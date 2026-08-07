import React from "react";

const field = (value) => value ?? "";

export default function AcademicFilterBar({
  filters,
  onChange,
  showKeyword = true,
  showJournal = true,
  showTopic = true,
  showYears = true,
  showSource = true,
  showCitations = true,
  showSort = true,
  showReset = false,
  onReset,
  className = "",
}) {
  const update = (name) => (event) => onChange({ [name]: event.target.value });
  return (
    <section className={`academic-filter-bar ${className}`.trim()} aria-label="Academic data filters">
      {showKeyword ? (
        <label><span>Keyword</span><input type="search" value={field(filters.keyword)} onChange={update("keyword")} placeholder="Title, keyword, author" /></label>
      ) : null}
      {showJournal ? (
        <label><span>Journal</span><input value={field(filters.journal)} onChange={update("journal")} placeholder="Journal name" /></label>
      ) : null}
      {showTopic ? (
        <label><span>Field / topic</span><input value={field(filters.researchTopic)} onChange={update("researchTopic")} placeholder="Research field" /></label>
      ) : null}
      {showYears ? (
        <>
          <label><span>From year</span><input type="number" min="1900" max="2100" value={field(filters.yearFrom)} onChange={update("yearFrom")} /></label>
          <label><span>To year</span><input type="number" min="1900" max="2100" value={field(filters.yearTo)} onChange={update("yearTo")} /></label>
        </>
      ) : null}
      {showSource ? (
        <label><span>Source</span><select value={field(filters.sourceApi)} onChange={update("sourceApi")}><option value="">All sources</option><option value="OpenAlex">OpenAlex</option><option value="Semantic Scholar">Semantic Scholar</option><option value="Crossref">Crossref</option><option value="SerpApi">Google Scholar (SerpApi)</option><option value="Connected Papers">Connected Papers (Graph)</option></select></label>
      ) : null}
      {showCitations ? (
        <>
          <label><span>Min citations</span><input type="number" min="0" value={field(filters.minCitations)} onChange={update("minCitations")} /></label>
          <label><span>Max citations</span><input type="number" min="0" value={field(filters.maxCitations)} onChange={update("maxCitations")} /></label>
        </>
      ) : null}
      {showSort ? (
        <label><span>Sort</span><select value={field(filters.sortBy) || "citations"} onChange={update("sortBy")}><option value="citations">Citations</option><option value="year">Publication year</option><option value="title">Title</option></select></label>
      ) : null}
      {showReset ? (
        <button type="button" className="academic-filter-reset" onClick={onReset}>Reset filters</button>
      ) : null}
    </section>
  );
}
