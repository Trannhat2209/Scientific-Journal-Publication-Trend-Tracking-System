// Generated module from the former App.jsx.
import React from "react";
import { Bar } from "react-chartjs-2";
import { emptyKeywordDifferential, yearMetricDefinitions } from "../../config/academic-metrics";
import TrendScoreInfo from "../../components/academic/TrendScoreInfo";
import ChartProvenance from "../../components/academic/ChartProvenance";
import { latestTimestamp } from "../../services/academic-query";
import { API_BASE_URL, MiniIcon, downloadCsvFile, getStoredAuth, reportMetrics, unwrapList, useApiResource } from "../../app/core.jsx";
import { ResearcherShell } from "./shell.jsx";

const reportSourceColors = {
  OpenAlex: "#2563eb",
  Crossref: "#16a34a",
  "Semantic Scholar": "#7c3aed",
  "Google Scholar": "#f59e0b",
  ResearchGate: "#ef4444",
};
const getReportSourceColor = (source, index) =>
  reportSourceColors[source] ||
  ["#0891b2", "#db2777", "#64748b", "#0f766e"][index % 4];

function ReportStepCard({ step, title, icon, children, accent = false }) {
  return (
    <section className={`report-step-card ${accent ? "accent" : ""}`}>
      <h2>
        <MiniIcon path={icon} /> Step {step}: {title}
      </h2>
      {children}
    </section>
  );
}

function ReportsPage() {
  const [reportKeyword, setReportKeyword] = React.useState("machine learning");
  const [reportFromYear, setReportFromYear] = React.useState("2018");
  const [reportToYear, setReportToYear] = React.useState("2023");
  const [reportFormat, setReportFormat] = React.useState("Csv");
  const [reportMessage, setReportMessage] = React.useState("");
  const [activeReportBarIndex, setActiveReportBarIndex] = React.useState(null);
  const [reportHistoryVersion, setReportHistoryVersion] = React.useState(0);
  const { data: reportHistory, status: reportHistoryStatus } = useApiResource(
    `/api/dashboard/reports?limit=20&refresh=${reportHistoryVersion}`,
    [],
    { auth: true, select: unwrapList },
  );
  const reportYearOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 2010 + 1 }, (_, index) =>
      String(currentYear - index),
    );
  }, []);
  const reportPreviewPath = React.useMemo(() => {
    const params = new URLSearchParams({
      keyword: reportKeyword,
      fromYear: reportFromYear,
      toYear: reportToYear,
    });
    return `/api/dashboard/report-preview?${params.toString()}`;
  }, [reportKeyword, reportFromYear, reportToYear]);
  const {
    data: reportPreviewData,
    status: reportPreviewStatus,
    error: reportPreviewError,
  } = useApiResource(reportPreviewPath, null, { auth: true });
  const reportCalculatedAt = reportPreviewData?.lastSyncedAt || null;
  const reportTotals = React.useMemo(() => {
    const startYear = Number(reportFromYear) || 2018;
    const endYear = Number(reportToYear) || 2023;
    const fallbackLabels = Array.from(
      { length: Math.max(1, endYear - startYear + 1) },
      (_, index) => String(startYear + index),
    );
    const rows = Array.isArray(reportPreviewData?.yearlyCounts)
      ? reportPreviewData.yearlyCounts
      : [];
    const labels = rows.length
      ? rows.map((row) => String(row.year ?? row.Year))
      : fallbackLabels;
    const counts = rows.length
      ? rows.map((row) =>
          Number(row.publicationCount ?? row.PublicationCount ?? 0),
        )
      : fallbackLabels.map(() => 0);
    const sourceBreakdown = Array.isArray(reportPreviewData?.sourceBreakdown)
      ? reportPreviewData.sourceBreakdown
      : [];
    const sourceNames = sourceBreakdown.map((item) => item.source);
    const countsBySource = rows.length
      ? rows.map((row) => {
          const sourceValues = row.sources || row.Sources || {};
          return Object.fromEntries(
            sourceNames.map((source) => [
              source,
              Number(sourceValues[source] || 0),
            ]),
          );
        })
      : fallbackLabels.map(() =>
          Object.fromEntries(sourceNames.map((source) => [source, 0])),
        );
    const maxCount = Math.max(...counts, 1);
    return {
      total: Number(reportPreviewData?.totalPublications ?? 0),
      averageGrowthRate: Number(reportPreviewData?.averageGrowthRate ?? 0),
      averageCitationsPerPaper: Number(
        reportPreviewData?.averageCitationsPerPaper ?? 0,
      ),
      labels,
      counts,
      countsBySource,
      sourceBreakdown,
      sourceNames,
      barHeights: counts.map((count) =>
        count > 0 ? Math.max(12, Math.round((count / maxCount) * 92)) : 4,
      ),
      topAuthors: Array.isArray(reportPreviewData?.topAuthors)
        ? reportPreviewData.topAuthors
        : [],
    };
  }, [reportFromYear, reportToYear, reportPreviewData]);
  const reportPreviousCounts = React.useMemo(
    () =>
      reportTotals.counts.map((count, index, rows) =>
        Number(index > 0 ? rows[index - 1] : 0),
      ),
    [reportTotals.counts],
  );
  const handleGenerateReport = async () => {
    setReportMessage("Generating report...");
    try {
      const token = getStoredAuth().accessToken;
      const response = await fetch(`${API_BASE_URL}/api/dashboard/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          keyword: reportKeyword,
          fromYear: Number(reportFromYear),
          toYear: Number(reportToYear),
          format: reportFormat === "Csv" ? 1 : 0,
        }),
      });
      if (!response.ok) throw new Error("Could not generate report.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const reportExtension = reportFormat === "Excel" ? "xlsx" : "csv";
      anchor.download = `trend-report-${reportKeyword.replace(/\s+/g, "-")}-${reportFromYear}-${reportToYear}.${reportExtension}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setReportMessage("Report exported from backend.");
      setReportHistoryVersion((version) => version + 1);
    } catch (error) {
      setReportMessage(error.message);
    }
  };

  const downloadHistoricalReport = async (report) => {
    setReportMessage(`Downloading ${report.fileName}...`);
    try {
      const token = getStoredAuth().accessToken;
      const response = await fetch(`${API_BASE_URL}/api/dashboard/reports/${report.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Could not download this report.");
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = report.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setReportMessage("Saved report downloaded.");
    } catch (error) {
      setReportMessage(error.message);
    }
  };

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
            <ReportStepCard
              step="1"
              title="Select Scope"
              icon="M4 5h16l-6 7v5l-4 2v-7L4 5ZM8 8h8M10 12h4"
            >
              <label className="report-field">
                <span>Keywords (Multi-select)</span>
                <div className="report-token-box">
                  <span>
                    {reportKeyword} <button type="button">x</button>
                  </span>
                  <span>
                    climate models <button type="button">x</button>
                  </span>
                  <input
                    type="text"
                    placeholder="Type and press enter..."
                    value={reportKeyword}
                    onChange={(event) => setReportKeyword(event.target.value)}
                  />
                </div>
              </label>
              <label className="report-field">
                <span>Journals (Multi-select)</span>
                <div className="report-empty-select"></div>
              </label>
              <div className="report-year-grid">
                <label className="report-field">
                  <span>Start Year</span>
                  <select
                    value={reportFromYear}
                    onChange={(event) => setReportFromYear(event.target.value)}
                    aria-label="Start year"
                  >
                    {reportYearOptions.map((year) => (
                      <option
                        value={year}
                        disabled={Number(year) > Number(reportToYear)}
                        key={`report-start-${year}`}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="report-field">
                  <span>End Year</span>
                  <select
                    value={reportToYear}
                    onChange={(event) => setReportToYear(event.target.value)}
                    aria-label="End year"
                  >
                    {reportYearOptions.map((year) => (
                      <option
                        value={year}
                        disabled={Number(year) < Number(reportFromYear)}
                        key={`report-end-${year}`}
                      >
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="report-field">
                <span>Topics</span>
                <input
                  type="text"
                  defaultValue="e.g. Artificial Intelligence, Genomics"
                />
              </label>
            </ReportStepCard>

            <ReportStepCard
              step="2"
              title="Choose Metrics"
              icon="M6 4.5h9l3 3V20H6zM15 4.5V8h3M9 15V9M12 15v-3M15 15v-5"
            >
              <div className="report-metric-options">
                {reportMetrics.map((metric, index) => (
                  <label key={metric}>
                    <input
                      type="checkbox"
                      defaultChecked={index !== 3 && index !== 5}
                    />
                    <span>
                      {metric}
                      {metric === "Trending Score A" ? (
                        <TrendScoreInfo type="raw" />
                      ) : metric === "Trending Score B" ? (
                        <TrendScoreInfo type="growth" />
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </ReportStepCard>

            <ReportStepCard
              step="4"
              title="Export Options"
              icon="M12 4v10M8 10l4 4 4-4M5 19h14M7 6h3M14 6h3"
              accent
            >
              <div className="report-format-options">
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={reportFormat === "Excel"}
                    onChange={() => setReportFormat("Excel")}
                  />{" "}
                  <span>Excel (.xlsx)</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="format"
                    checked={reportFormat === "Csv"}
                    onChange={() => setReportFormat("Csv")}
                  />{" "}
                  <span>CSV</span>
                </label>
              </div>
              <label className="report-switch">
                <input type="checkbox" defaultChecked />
                <span>Include raw data sheets</span>
              </label>
              <button
                type="button"
                className="report-generate-button"
                onClick={handleGenerateReport}
              >
                <MiniIcon path="M13 3 5 14h6l-1 7 8-11h-6l1-7ZM8 5h2M15 18h2" />
                Generate Report
              </button>
              {reportMessage ? (
                <p className="report-status">{reportMessage}</p>
              ) : null}
            </ReportStepCard>
          </aside>

          <section className="reports-preview-column">
            <section className="report-preview-card">
              <div className="report-panel-heading">
                <h2>
                  <MiniIcon path="M2.5 12s3.5-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.5 5.5-9.5 5.5S2.5 12 2.5 12ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6ZM16.5 6.5l2-2" />{" "}
                  Step 3: Live Preview
                </h2>
                <button type="button">Sample Data</button>
              </div>
              <div className="report-document-preview">
                <h3>
                  Trend Analysis: {reportKeyword || "Selected keyword"} (
                  {reportFromYear}-{reportToYear})
                </h3>
                <p>
                  Generated on: {new Date().toLocaleDateString()} - Scope:
                  backend publication data
                  {reportPreviewStatus === "loading" ? " - refreshing..." : ""}
                </p>
                {reportPreviewError ? (
                  <p className="report-status" role="alert">
                    Preview could not be loaded: {reportPreviewError.message}
                  </p>
                ) : null}
                <div className="report-preview-metrics">
                  <div>
                    <span>Total Publications</span>
                    <strong>
                      {reportTotals.total.toLocaleString("en-US")}
                    </strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Growth Rate</span>
                    <strong>
                      {reportTotals.averageGrowthRate.toFixed(1)}%
                    </strong>
                    <i></i>
                  </div>
                  <div>
                    <span>Avg Citations/Paper</span>
                    <strong>
                      {reportTotals.averageCitationsPerPaper.toFixed(1)}
                    </strong>
                    <i></i>
                  </div>
                </div>
                <div
                  className="report-bar-chart"
                  aria-label="Publication bar chart"
                >
                  <div className="report-source-legend" aria-label="Synchronized API sources">
                    {reportTotals.sourceBreakdown.map((item, sourceIndex) => (
                      <span key={item.source}>
                        <i style={{ backgroundColor: getReportSourceColor(item.source, sourceIndex) }}></i>
                        {item.source}: {Number(item.publicationCount || 0).toLocaleString("en-US")}
                      </span>
                    ))}
                  </div>
                  {reportTotals.barHeights.map((height, index) => {
                    const label = reportTotals.labels[index] || "Year";
                    const count = Number(reportTotals.counts[index] || 0);
                    const previousCount = Number(
                      reportPreviousCounts[index] || 0,
                    );
                    const active = activeReportBarIndex === index;

                    return (
                      <button
                        type="button"
                        className={`report-chart-bar ${active ? "active" : ""} ${
                          index === 0
                            ? "edge-left"
                            : index === reportTotals.barHeights.length - 1
                              ? "edge-right"
                              : ""
                        }`}
                        key={`report-preview-bar-${index}`}
                        aria-label={`${label}: ${count} publications, previous year ${previousCount} publications`}
                        onClick={() => setActiveReportBarIndex(index)}
                        onFocus={() => setActiveReportBarIndex(index)}
                        onMouseEnter={() => setActiveReportBarIndex(index)}
                        style={{ height: `${height}%` }}
                      >
                        <span className="report-chart-stack" aria-hidden="true">
                          {reportTotals.sourceNames.map((source, sourceIndex) => {
                            const sourceCount = Number(
                              reportTotals.countsBySource[index]?.[source] || 0,
                            );
                            if (!count || !sourceCount) return null;
                            return (
                              <i
                                key={`${label}-${source}`}
                                style={{
                                  height: `${(sourceCount / count) * 100}%`,
                                  backgroundColor: getReportSourceColor(source, sourceIndex),
                                }}
                              ></i>
                            );
                          })}
                        </span>
                        <span className="report-chart-year">{label}</span>
                        {active ? (
                          <span className="report-chart-tooltip">
                            <strong>{label}</strong>
                            <em>
                              <b></b>
                              Publications Over Time:{" "}
                              {count.toLocaleString("en-US")} publications
                            </em>
                            <em>
                              <b className="previous"></b>
                              Previous Year:{" "}
                              {previousCount.toLocaleString("en-US")}{" "}
                              publications
                            </em>
                            {reportTotals.sourceNames.map((source, sourceIndex) => (
                              <em key={`tooltip-${label}-${source}`}>
                                <b style={{ backgroundColor: getReportSourceColor(source, sourceIndex) }}></b>
                                {source}: {Number(reportTotals.countsBySource[index]?.[source] || 0).toLocaleString("en-US")}
                              </em>
                            ))}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <ChartProvenance
                  source={
                    reportTotals.sourceNames.length
                      ? reportTotals.sourceNames.join(", ")
                      : "No synchronized API publication matched this scope"
                  }
                  syncedAt={reportCalculatedAt}
                />
                <table className="report-author-table">
                  <thead>
                    <tr>
                      <th>Top Authors</th>
                      <th>Pubs</th>
                      <th>
                        Trend Score A
                        <TrendScoreInfo type="authorShare" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportTotals.topAuthors.length ? (
                      reportTotals.topAuthors.map((author) => (
                        <tr key={author.name}>
                          <td>{author.name}</td>
                          <td>{author.publications}</td>
                          <td>{Number(author.trendScore || 0).toFixed(1)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">No author data for this scope</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-history-card">
              <div className="report-panel-heading">
                <h2>Report History</h2>
              </div>
              {reportHistoryStatus === "loading" ? <p>Loading reports...</p> : null}
              {!reportHistory.length && reportHistoryStatus !== "loading" ? (
                <p>No generated reports yet.</p>
              ) : (
                <table>
                  <thead><tr><th>Report</th><th>Period</th><th>Status</th><th>Created</th><th></th></tr></thead>
                  <tbody>
                    {reportHistory.map((report) => (
                      <tr key={report.id}>
                        <td><strong>{report.fileName}</strong><small>{report.keyword || "All topics"} · {report.format}</small></td>
                        <td>{report.fromYear}–{report.toYear}</td>
                        <td><span className={`report-history-status ${String(report.status).toLowerCase()}`}>{report.status}</span></td>
                        <td>{new Date(report.createdAt).toLocaleString()}</td>
                        <td><button type="button" disabled={report.status !== "Completed"} onClick={() => downloadHistoricalReport(report)}>Download</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
      <AnimatedMetricValue value={card.value} />
      {card.note ? <small>{card.note}</small> : null}
      {card.bars ? (
        <div className="year-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i style={{ height: `${height}%` }} key={index}></i>
          ))}
        </div>
      ) : (
        <div className="year-rank-grid">
          {card.ranks.map((rank, index) => (
            <span
              className={card.danger && index === 1 ? "danger" : ""}
              key={rank}
            >
              {rank}
            </span>
          ))}
        </div>
      )}
      {card.subvalue ? (
        <b className={card.danger ? "danger" : ""}>{card.subvalue}</b>
      ) : null}
    </article>
  );
}

function AnimatedMetricValue({ value }) {
  const numericValue = Number(String(value).replace(/[^0-9.-]/g, ""));
  const isNumeric = Number.isFinite(numericValue) && /\d/.test(String(value));
  const previousValueRef = React.useRef(isNumeric ? numericValue : 0);
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    if (!isNumeric) {
      setDisplayValue(value);
      return undefined;
    }
    const startValue = previousValueRef.current;
    const difference = numericValue - startValue;
    const startedAt = performance.now();
    let frameId = 0;
    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / 520);
      const eased = 1 - (1 - progress) ** 3;
      const current = Math.round(startValue + difference * eased);
      setDisplayValue(current.toLocaleString("en-US"));
      if (progress < 1) frameId = requestAnimationFrame(animate);
      else previousValueRef.current = numericValue;
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isNumeric, numericValue, value]);

  return <strong className="animated-metric-value">{displayValue}</strong>;
}

function YearTrajectoryChart({
  baselineYear = "2024",
  comparisonYear = "2025",
  baselineTotal = 0,
  comparisonTotal = 0,
  syncedAt = null,
  loading = false,
}) {
  const maxQuarterValue = Math.max(baselineTotal, comparisonTotal, 1);
  const difference = comparisonTotal - baselineTotal;
  const percentChange = baselineTotal
    ? (difference / baselineTotal) * 100
    : comparisonTotal
      ? 100
      : 0;
  const valueLabelPlugin = React.useMemo(
    () => ({
      id: "yearComparisonValueLabels",
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.fillStyle = "#172033";
        ctx.font = "700 13px Inter, sans-serif";
        ctx.textAlign = "center";
        chart.getDatasetMeta(0).data.forEach((bar, index) => {
          const value = Number(chart.data.datasets[0].data[index] || 0);
          ctx.fillText(value.toLocaleString("en-US"), bar.x, Math.max(16, bar.y - 10));
        });
        ctx.restore();
      },
    }),
    [],
  );
  return (
    <section className={`year-chart-card${loading ? " is-updating" : ""}`} aria-busy={loading}>
      <div className="year-chart-heading">
        <h2>
          Actual annual publication volume
        </h2>
        <div className="year-chart-legend">
          <span>
            <i className="baseline"></i> {baselineYear}
            <br />
            (Baseline)
          </span>
          <span>
            <i className="comparison"></i> {comparisonYear}
            <br />
            (Comparison)
          </span>
        </div>
      </div>
      <div className="year-chart-summary" aria-live="polite">
        <div>
          <span>{baselineYear} baseline</span>
          <strong>{baselineTotal.toLocaleString("en-US")}</strong>
        </div>
        <div>
          <span>{comparisonYear} comparison</span>
          <strong>{comparisonTotal.toLocaleString("en-US")}</strong>
        </div>
        <div className={difference >= 0 ? "positive" : "negative"}>
          <span>Change</span>
          <strong>{difference >= 0 ? "+" : ""}{difference.toLocaleString("en-US")} ({percentChange >= 0 ? "+" : ""}{percentChange.toFixed(1)}%)</strong>
        </div>
      </div>
      <div style={{ height: "400px", padding: "20px" }}>
        <Bar
          key={`${baselineYear}-${comparisonYear}-${baselineTotal}-${comparisonTotal}`}
          data={{
            labels: [baselineYear, comparisonYear],
            datasets: [
              {
                label: "Annual publications",
                data: [baselineTotal, comparisonTotal],
                backgroundColor: ["#cbd5e1", "#5546e8"],
                borderColor: ["#94a3b8", "#4338ca"],
                borderWidth: 1,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 150,
                minBarLength: 8,
              },
            ],
          }}
          plugins={[valueLabelPlugin]}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                display: false, // Using custom legend above
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                padding: 14,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                bodySpacing: 6,
                callbacks: {
                  title: function (context) {
                    return "Year " + context[0].label;
                  },
                  label: function (context) {
                    const value = context.parsed.y;
                    const formatted =
                      value >= 1000
                        ? (value / 1000).toFixed(1) + "k"
                        : value.toString();
                    return formatted + " publications";
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: Math.ceil(maxQuarterValue * 1.2),
                grid: {
                  color: "rgba(0, 0, 0, 0.06)",
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 11,
                  },
                  callback: function (value) {
                    if (value === 0) return "0";
                    return value >= 1000
                      ? (value / 1000).toFixed(1) + "k"
                      : value.toLocaleString("en-US");
                  },
                },
                border: {
                  display: false,
                },
              },
              x: {
                grid: {
                  display: false,
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 12,
                    weight: "500",
                  },
                },
                border: {
                  display: false,
                },
              },
            },
          }}
        />
      </div>
      <ChartProvenance source="ScholarTrend calculated metrics" syncedAt={syncedAt} />
    </section>
  );
}

function YearKeywordDifferential({ rows = emptyKeywordDifferential }) {
  return (
    <section className="year-keyword-card">
      <div className="year-keyword-heading">
        <h2>Keyword Differential</h2>
        <MiniIcon path="M5 7h14M9 12h10M13 17h6" />
      </div>
      <table>
        <thead>
          <tr>
            <th>Keyword</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.keyword}>
              <td>{row.keyword}</td>
              <td>
                <span className={row.tone}>{row.delta}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function YearComparisonPage() {
  const [baselineYear, setBaselineYear] = React.useState("2024");
  const [comparisonYear, setComparisonYear] = React.useState("2025");
  const fromYear = Math.min(Number(baselineYear), Number(comparisonYear));
  const toYear = Math.max(Number(baselineYear), Number(comparisonYear));
  const { data: comparisonTrendRows, status: comparisonStatus } = useApiResource(
    `/api/trends?fromYear=${fromYear}&toYear=${toYear}&strategy=StrategyA_RawCount`,
    [],
    { select: unwrapList },
  );
  const comparisonStats = React.useMemo(() => {
    if (!comparisonTrendRows.length) {
      return {
        baselineTotal: 0,
        comparisonTotal: 0,
        keywordRows: [],
        metricCards: yearMetricDefinitions.map((card) => ({
          ...card,
          value: "0",
          note: "No calculated data",
          subvalue: "",
          ranks: [],
          bars: [4, 4],
        })),
      };
    }

    const byKeyword = comparisonTrendRows.reduce((acc, item) => {
      const keyword = item.keyword || item.Keyword || "Unknown keyword";
      const year = String(item.year || item.Year);
      const count = Number(item.publicationCount ?? item.PublicationCount ?? 0);
      if (!acc[keyword]) acc[keyword] = { keyword, baseline: 0, comparison: 0 };
      if (year === baselineYear) acc[keyword].baseline += count;
      if (year === comparisonYear) acc[keyword].comparison += count;
      return acc;
    }, {});
    const keywordRows = Object.values(byKeyword)
      .map((item) => {
        const delta =
          item.baseline > 0
            ? ((item.comparison - item.baseline) / item.baseline) * 100
            : item.comparison > 0
              ? 100
              : 0;
        return {
          keyword: item.keyword,
          delta: `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`,
          tone: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          volume: item.comparison,
        };
      })
      .sort(
        (left, right) =>
          Math.abs(Number.parseFloat(right.delta)) -
          Math.abs(Number.parseFloat(left.delta)),
      )
      .slice(0, 6);
    const baselineTotal = Object.values(byKeyword).reduce(
      (sum, item) => sum + item.baseline,
      0,
    );
    const comparisonTotal = Object.values(byKeyword).reduce(
      (sum, item) => sum + item.comparison,
      0,
    );
    const growth =
      baselineTotal > 0
        ? ((comparisonTotal - baselineTotal) / baselineTotal) * 100
        : 0;
    const topKeyword = keywordRows[0]?.keyword || "No keyword";

    return {
      baselineTotal,
      comparisonTotal,
      keywordRows,
      metricCards: [
        {
          ...yearMetricDefinitions[0],
          value: comparisonTotal.toLocaleString("en-US"),
          note: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
        },
        {
          ...yearMetricDefinitions[1],
          value: baselineTotal.toLocaleString("en-US"),
          note: `${baselineYear} baseline`,
        },
        {
          ...yearMetricDefinitions[2],
          value: topKeyword.slice(0, 14),
          subvalue: keywordRows[0]?.delta || "Stable",
        },
        {
          ...yearMetricDefinitions[3],
          label: "Calculated data points",
          value: comparisonTrendRows.length.toLocaleString("en-US"),
          subvalue: "",
          ranks: [],
          bars: [
            Math.max(4, Math.min(90, comparisonTrendRows.length)),
            Math.max(4, Math.min(90, keywordRows.length * 10)),
          ],
          danger: false,
        },
      ],
    };
  }, [baselineYear, comparisonTrendRows, comparisonYear]);
  const exportComparisonData = () => {
    downloadCsvFile(
      `scholartrend-year-comparison-${baselineYear}-vs-${comparisonYear}.csv`,
      [
        ["Metric", "Value"],
        ["Baseline Year", baselineYear],
        ["Comparison Year", comparisonYear],
        ["Baseline Total", comparisonStats.baselineTotal],
        ["Comparison Total", comparisonStats.comparisonTotal],
        [],
        ["Keyword", "Delta", "Tone", "Comparison Volume"],
        ...comparisonStats.keywordRows.map((row) => [
          row.keyword,
          row.delta,
          row.tone,
          row.volume ?? "",
        ]),
      ],
    );
  };

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
          <form
            className="year-controls"
            onSubmit={(event) => event.preventDefault()}
          >
            <label>
              Baseline{" "}
              <select
                value={baselineYear}
                onChange={(event) => setBaselineYear(event.target.value)}
              >
                <option>2024</option>
                <option>2023</option>
                <option>2022</option>
                <option>2021</option>
              </select>
            </label>
            <MiniIcon path="M8 7h10M14 3l4 4-4 4M16 17H6M10 13l-4 4 4 4" />
            <label>
              Comparison{" "}
              <select
                value={comparisonYear}
                onChange={(event) => setComparisonYear(event.target.value)}
              >
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
                <option>2023</option>
              </select>
            </label>
            <button type="button" onClick={exportComparisonData}>
              <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" /> Export Data
            </button>
          </form>
        </section>

        <section
          className="year-metric-grid"
          aria-label="Year comparison metrics"
        >
          {comparisonStats.metricCards.map((card) => (
            <YearMetricCard card={card} key={card.label} />
          ))}
        </section>

        <div className="year-analysis-grid">
          <YearTrajectoryChart
            baselineYear={baselineYear}
            comparisonYear={comparisonYear}
            baselineTotal={comparisonStats.baselineTotal}
            comparisonTotal={comparisonStats.comparisonTotal}
            syncedAt={latestTimestamp(comparisonTrendRows)}
            loading={comparisonStatus === "loading"}
          />
          <YearKeywordDifferential rows={comparisonStats.keywordRows} />
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
        <div>
          <span>Synced Records</span>
          <strong>{source.synced}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>{source.latency}</strong>
        </div>
        <div>
          <span>Coverage</span>
          <strong>{source.coverage}</strong>
        </div>
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
            <h1>Academic Data Sync Management</h1>
            <p>
              Monitor publication metadata ingestion, API comparison samples,
              normalization, scheduled jobs, and failure logs.
            </p>
          </div>
          <div className="sync-hero-actions">
            <button type="button" className="sync-secondary-button">
              <MiniIcon path="M4 4v6h6M20 20v-6h-6M20 8a7 7 0 0 0-12.1-4M4 16a7 7 0 0 0 12.1 4M9 12h6" />{" "}
              Run Dry Check
            </button>
            <button type="button" className="sync-primary-button">
              <MiniIcon path="M12 5v14M5 12h14M7 7l10 10" /> Start Sync
            </button>
          </div>
        </section>

        <section className="sync-source-grid" aria-label="Sync data sources">
          {[].map((source) => (
            <SyncSourceCard source={source} key={source.name} />
          ))}
        </section>

        <div className="sync-dashboard-grid">
          <section className="sync-panel sync-pipeline-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M4 7h4l3 10h4l3-10h2M7 7.5a6 6 0 0 1 10.2-2.8M17 16.5a6 6 0 0 1-10.2 2.8" />{" "}
                Metadata Pipeline
              </h2>
              <span>Current batch: #SS-2026-0618</span>
            </div>
            <div className="sync-pipeline-steps">
              {[].map((step, index) => (
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
              <h2>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6zM9 13h2M13 13h2M9 16h2" />{" "}
                Hangfire Schedule
              </h2>
              <button type="button">Configure</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Last Run</th>
                  <th>Duration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[].map((job) => (
                  <tr key={job.job}>
                    <td>{job.job}</td>
                    <td>{job.schedule}</td>
                    <td>{job.lastRun}</td>
                    <td>{job.duration}</td>
                    <td>
                      <span className={job.status.toLowerCase()}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="sync-panel sync-health-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M12 21s8-4.5 8-11V5l-8-3-8 3v5c0 6.5 8 11 8 11ZM8.5 12l2.2 2.2L15.8 9" />{" "}
                Database Health
              </h2>
            </div>
            <div className="sync-health-grid">
              <div>
                <span>Canonical Publications</span>
                <strong>152,900</strong>
                <i style={{ width: "88%" }}></i>
              </div>
              <div>
                <span>Normalized Authors</span>
                <strong>48,730</strong>
                <i style={{ width: "74%" }}></i>
              </div>
              <div>
                <span>Duplicate Merge Rate</span>
                <strong>3.8%</strong>
                <i style={{ width: "38%" }}></i>
              </div>
              <div>
                <span>Error Queue</span>
                <strong>42</strong>
                <i className="danger" style={{ width: "24%" }}></i>
              </div>
            </div>
          </section>

          <section className="sync-panel sync-log-panel">
            <div className="sync-panel-heading">
              <h2>
                <MiniIcon path="M5 5h14v14H5zM8 9h8M8 13h8M8 17h5M18 4l2-2M20 6l2-2" />{" "}
                Sync Logs & Errors
              </h2>
              <span>Live logging</span>
            </div>
            <div className="sync-log-list">
              {[].map((log) => (
                <article
                  className={`sync-log ${log.level.toLowerCase()}`}
                  key={`${log.time}-${log.message}`}
                >
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

export { ReportStepCard, ReportsPage, YearMetricCard, YearTrajectoryChart, YearKeywordDifferential, YearComparisonPage, SyncSourceCard, SyncManagementPage };
