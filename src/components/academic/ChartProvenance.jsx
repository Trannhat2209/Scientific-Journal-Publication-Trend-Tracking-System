import React from "react";
import DataProvenance from "./DataProvenance";

export default function ChartProvenance({
  source,
  syncedAt,
  sourceUrl,
  sample = false,
  className = "",
}) {
  if (sample) {
    return (
      <small className={`academic-data-provenance chart-provenance sample ${className}`.trim()}>
        <strong>Source: Illustrative ScholarTrend sample</strong>
        <span> · Data status: Demonstration only</span>
      </small>
    );
  }

  return (
    <DataProvenance
      source={source}
      sourceUrl={sourceUrl}
      syncedAt={syncedAt}
      className={`chart-provenance ${className}`.trim()}
      compact
    />
  );
}
