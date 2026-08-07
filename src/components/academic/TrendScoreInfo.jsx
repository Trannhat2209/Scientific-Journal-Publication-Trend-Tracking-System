import React from "react";

const explanations = {
  growth: {
    title: "Publication growth score",
    formula: "((publications this year − publications last year) ÷ (publications last year + 1)) × 100",
    scale: "A percentage growth indicator. It can be negative or exceed 100; it is not a normalized 0–100 rating.",
  },
  raw: {
    title: "Raw publication volume",
    formula: "Number of matching publications in the selected year or period",
    scale: "A count, not a normalized score. Larger values mean more indexed publications.",
  },
  authorShare: {
    title: "Author share score",
    formula: "(author publications in the selected scope ÷ all publications in that scope) × 100",
    scale: "Normalized from 0–100 for the currently selected report period.",
  },
};

export default function TrendScoreInfo({ type = "growth", calculatedAt }) {
  const content = explanations[type] || explanations.growth;
  const tooltipId = React.useId();
  return (
    <span className="trend-score-info">
      <button type="button" aria-label={`Explain ${content.title}`} aria-describedby={tooltipId}>i</button>
      <span className="trend-score-tooltip" id={tooltipId} role="tooltip">
        <strong>{content.title}</strong>
        <span>Formula: {content.formula}</span>
        <span>{content.scale}</span>
        <span>
          Scope: the active keyword, filters, and selected time range.
          {calculatedAt ? ` Calculated ${new Date(calculatedAt).toLocaleString()}.` : ""}
        </span>
      </span>
    </span>
  );
}
