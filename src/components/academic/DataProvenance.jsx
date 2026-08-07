import React from "react";

export const formatAcademicTimestamp = (value, fallback = "Not recorded") => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
};

export default function DataProvenance({
  source,
  sourceUrl,
  syncedAt,
  timestampLabel = "Synced",
  className = "",
  compact = false,
}) {
  const sourceName = String(source || "Unknown source").trim();
  return (
    <small
      className={`academic-data-provenance ${compact ? "compact" : ""} ${className}`.trim()}
      aria-label={`Data source ${sourceName}. ${timestampLabel} ${formatAcademicTimestamp(syncedAt)}`}
    >
      <span>Source: </span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          {sourceName}
        </a>
      ) : (
        <strong>{sourceName}</strong>
      )}
      <span> · {timestampLabel}: {formatAcademicTimestamp(syncedAt)}</span>
    </small>
  );
}
