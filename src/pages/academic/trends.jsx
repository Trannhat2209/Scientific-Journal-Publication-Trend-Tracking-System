// Generated module from the former App.jsx.
import React from "react";
import { Line } from "react-chartjs-2";
import { trendMetricDefinitions } from "../../config/academic-metrics";
import AcademicFilterBar from "../../components/academic/AcademicFilterBar";
import DataProvenance from "../../components/academic/DataProvenance";
import TrendScoreInfo from "../../components/academic/TrendScoreInfo";
import { buildTrendQuery, latestTimestamp } from "../../services/academic-query";
import { MiniIcon, downloadCsvFile, formatCount, navTo, trendTopicFilters, unwrapList, useApiResource } from "../../app/core.jsx";
import { ResearcherShell } from "./shell.jsx";

function TrendMetricCard({ card }) {
  return (
    <article className={`trend-metric-card ${card.tone}`}>
      <div className="trend-card-label">
        <span>
          {card.label}
          {card.tooltipType ? (
            <TrendScoreInfo type={card.tooltipType} calculatedAt={card.calculatedAt} />
          ) : null}
        </span>
        {card.sublabel ? <em>{card.sublabel}</em> : null}
        <MiniIcon path={card.icon} />
      </div>
      <div className="trend-card-value-row">
        <strong>{card.value}</strong>
        {card.note ? <small>{card.note}</small> : null}
      </div>
      {card.bars ? (
        <div className="trend-mini-bars" aria-hidden="true">
          {card.bars.map((height, index) => (
            <i
              style={{ height: `${height}%` }}
              key={`${card.label}-${index}`}
            ></i>
          ))}
        </div>
      ) : (
        <div className="trend-score-track" aria-hidden="true">
          <i style={{ width: `${card.score}%` }}></i>
        </div>
      )}
    </article>
  );
}

function TrendKeywordsOverview() {
  const [sortMode, setSortMode] = React.useState("count");
  const [activeTopic, setActiveTopic] = React.useState(trendTopicFilters[0]);
  const { data: overviewKeywords } = useApiResource(
    "/api/trends/top-keywords?count=8",
    [],
    {
      select: (payload) =>
        unwrapList(payload).map((item, index) => ({
          keyword: item.keyword,
          category: "Backend trend",
          mentions: formatCount(item.totalCount),
          totalCount: Number(item.totalCount || 0),
          change: Number(item.trendingScore || 0).toFixed(1),
          calculatedAt: item.calculatedAt || item.CalculatedAt,
          tone: "up",
          selected: index === 0,
        })),
    },
  );
  const displayedKeywords = React.useMemo(
    () => [...overviewKeywords].sort((left, right) => sortMode === "growth"
      ? Number(right.change) - Number(left.change)
      : right.totalCount - left.totalCount),
    [overviewKeywords, sortMode],
  );
  return (
    <section
      className="trend-keywords-overview"
      aria-label="Top keywords overview"
    >
      <div className="trend-overview-heading">
        <div>
          <span>Dashboard&nbsp; &gt;&nbsp; Trending Keywords</span>
          <h2>Top Keywords Overview</h2>
        </div>
        <div
          className="trend-sort-toggle"
          aria-label="Keyword ranking strategy"
        >
          <button type="button" className={sortMode === "count" ? "active" : ""} onClick={() => setSortMode("count")}>
            By Count
          </button>
          <button type="button" className={sortMode === "growth" ? "active" : ""} onClick={() => setSortMode("growth")}>By Growth</button>
        </div>
      </div>

      <div className="trend-topic-filters" aria-label="Topic filters">
        {trendTopicFilters.map((filter) => (
          <button
            type="button"
            className={activeTopic === filter ? "active" : ""}
            key={filter}
            onClick={() => setActiveTopic(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="trend-keyword-card-grid">
        {displayedKeywords.map((keyword) => (
          <article
            className={`trend-keyword-card ${keyword.selected ? "selected" : ""}`}
            key={keyword.keyword}
          >
            <div className="trend-keyword-topline">
              <div>
                <h3>{keyword.keyword}</h3>
                <span>{keyword.category}</span>
              </div>
              <button
                type="button"
                aria-label={
                  keyword.selected
                    ? `Selected ${keyword.keyword}`
                    : `Add ${keyword.keyword}`
                }
                onClick={navTo("/researcher-trend-tracking")}
              >
                {keyword.selected ? (
                  <MiniIcon path="M5 12.5 9.2 16.5 19 7" />
                ) : (
                  "+"
                )}
              </button>
            </div>
            <div className="trend-keyword-bottomline">
              <div>
                <strong>{keyword.mentions}</strong>
                <span>Mentions</span>
              </div>
              <em className={keyword.tone}>
                {keyword.tone === "up" ? (
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                ) : (
                  <MiniIcon path="M12 5v14M7 14l5 5 5-5" />
                )}
                {keyword.change}
                <TrendScoreInfo type="growth" calculatedAt={keyword.calculatedAt} />
              </em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TrendMainChart({
  dateRange = "2022-2026",
  keyword = "Machine Learning",
  comparisonKeyword = "",
  filters = {},
}) {
  const [chartMode, setChartMode] = React.useState("timeline");
  // Parse date range to get fromYear and toYear
  const yearMatch = dateRange.match(/(\d{4})-(\d{4})/);
  const fromYear = yearMatch ? yearMatch[1] : "2022";
  const toYear = yearMatch ? yearMatch[2] : "2026";
  const primaryTrendQuery = buildTrendQuery(
    { ...filters, keyword: keyword || "Machine Learning", yearFrom: fromYear, yearTo: toYear },
    { strategy: "StrategyA_RawCount" },
  );

  const { data: backendTrendData } = useApiResource(
    `/api/trends?${primaryTrendQuery}`,
    [],
    { select: unwrapList },
  );
  const comparisonTrendQuery = buildTrendQuery(
    { ...filters, keyword: comparisonKeyword, yearFrom: fromYear, yearTo: toYear },
    { strategy: "StrategyA_RawCount" },
  );
  const { data: backendComparisonData } = useApiResource(
    comparisonKeyword
      ? `/api/trends?${comparisonTrendQuery}`
      : null,
    [],
    { select: unwrapList },
  );

  const { data: journalRows } = useApiResource(
    "/api/dashboard/top-journals?limit=10",
    [],
    { select: unwrapList },
  );

  const aggregateTrendRows = (items) =>
    items.reduce((rowsByYear, item) => {
      const year = Number(item.year || item.Year);
      const value = Number(item.publicationCount ?? item.PublicationCount ?? 0);
      const minYear = Number(fromYear);
      const maxYear = Number(toYear);
      if (year < minYear || year > maxYear || value < 0) return rowsByYear;
      rowsByYear[year] = {
        year: String(year),
        value: (rowsByYear[year]?.value || 0) + value,
      };
      return rowsByYear;
    }, {});
  const backendRowsByYear = aggregateTrendRows(backendTrendData);
  const comparisonRowsByYear = aggregateTrendRows(backendComparisonData);

  // Get number of years to display based on date range
  const yearCount = Number(toYear) - Number(fromYear) + 1;

  const chartRows = Array.from({ length: yearCount }, (_, index) => {
    const year = Number(fromYear) + index;
    return {
      year: String(year),
      value: backendRowsByYear[year]?.value ?? 0,
    };
  });
  const labels = chartRows.map((item) => item.year);
  const values = chartRows.map((item) => item.value);
  const comparisonValues = comparisonKeyword
    ? chartRows.map(
        (item) => comparisonRowsByYear[Number(item.year)]?.value ?? 0,
      )
    : [];
  const maxChartValue = Math.max(...values, ...comparisonValues, 1);
  const trendAxisMax = Math.max(4, Math.ceil(maxChartValue * 1.12));
  const trendStepSize = Math.max(1, Math.ceil(trendAxisMax / 5));

  return (
    <section
      className="trend-panel trend-chart-panel"
      aria-label="Publication trend over time"
    >
      <div className="trend-tabs">
        <button type="button" className={chartMode === "timeline" ? "active" : ""} onClick={() => setChartMode("timeline")}>
          Publications Over Time
        </button>
        <button type="button" className={chartMode === "journals" ? "active" : ""} onClick={() => setChartMode("journals")}>Distribution by Journal</button>
      </div>
      <div
        className="trend-chart-wrap"
        style={{ height: "400px", padding: "20px" }}
      >
        <Line
          data={{
            labels: chartMode === "journals" ? journalRows.map((item) => item.name || item.journalName || item.label || "Journal") : labels,
            datasets: [
              {
                label: chartMode === "journals" ? "Publications by journal" : (keyword || "Machine Learning"),
                data: chartMode === "journals" ? journalRows.map((item) => Number(item.publicationCount ?? item.count ?? item.value ?? 0)) : values,
                borderColor: "rgba(99, 102, 241, 1)",
                backgroundColor: "rgba(99, 102, 241, 0.13)",
                tension: 0.32,
                fill: true,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointBackgroundColor: "rgba(99, 102, 241, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointHoverBackgroundColor: "rgba(99, 102, 241, 1)",
                pointHoverBorderColor: "#fff",
                borderWidth: 3,
              },
              ...(comparisonKeyword && chartMode === "timeline" ? [{
                label: comparisonKeyword || "Previous Year",
                data: comparisonValues,
                borderColor: "rgba(156, 163, 175, 0.62)",
                backgroundColor: "rgba(156, 163, 175, 0)",
                tension: 0.32,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: "rgba(156, 163, 175, 0.62)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                borderWidth: 2,
                borderDash: [5, 5],
              }] : []),
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
                align: "end",
                labels: {
                  usePointStyle: true,
                  boxWidth: 10,
                  boxHeight: 10,
                  padding: 18,
                  color: "#4b5563",
                  font: {
                    size: 13,
                  },
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                padding: 12,
                titleFont: {
                  size: 14,
                  weight: "bold",
                },
                bodyFont: {
                  size: 13,
                },
                callbacks: {
                  label: function (context) {
                    return (
                      context.dataset.label +
                      ": " +
                      context.parsed.y.toLocaleString() +
                      " publications"
                    );
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                min: 0,
                max: trendAxisMax,
                grid: {
                  color: "rgba(0, 0, 0, 0.06)",
                  drawBorder: false,
                },
                ticks: {
                  font: {
                    size: 12,
                  },
                  callback: function (value) {
                    if (value >= 1000000) {
                      return Math.round(value / 100000) / 10 + "M";
                    } else if (value >= 1000) {
                      return Math.round(value / 100) / 10 + "k";
                    }
                    return value;
                  },
                  stepSize: trendStepSize,
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
                  color: "#5f6674",
                  font: {
                    size: 13,
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
      <DataProvenance
        source="ScholarTrend calculated metrics"
        syncedAt={latestTimestamp(backendTrendData)}
        timestampLabel="Calculated"
      />
    </section>
  );
}

function TrendSparkline({ values }) {
  return (
    <span className="trend-sparkline" aria-hidden="true">
      {values.map((height, index) => (
        <i style={{ height: `${height}%` }} key={index}></i>
      ))}
    </span>
  );
}

function TrendRankingTables({ filters = {} }) {
  const rankingQuery = buildTrendQuery(filters, {
    strategy: "StrategyB_GrowthRate",
  });
  const { data: backendTopKeywords } = useApiResource(
    `/api/trends?${rankingQuery}`,
    [],
    { select: unwrapList },
  );
  const rankingRows = backendTopKeywords.length
    ? Object.values(
        backendTopKeywords.reduce((rows, item) => {
          const keywordName = item.keyword || item.Keyword || "Unknown keyword";
          const score = Number(item.trendingScore ?? item.TrendingScore ?? 0);
          const count = Number(item.publicationCount ?? item.PublicationCount ?? 0);
          if (!rows[keywordName]) {
            rows[keywordName] = { keyword: keywordName, total: 0, scores: [] };
          }
          rows[keywordName].total += count;
          rows[keywordName].scores.push(score);
          return rows;
        }, {}),
      ).map((item) => {
        const score =
          item.scores.reduce((sum, value) => sum + value, 0) /
          Math.max(1, item.scores.length);
        return {
          keyword: item.keyword,
          count: item.total.toLocaleString("en-US"),
          growth: `${score.toFixed(1)}%`,
          values: [
            Math.max(12, Math.min(95, score * 0.45 + 18)),
            Math.max(12, Math.min(95, score * 0.55 + 20)),
            Math.max(12, Math.min(95, score * 0.65 + 22)),
            Math.max(12, Math.min(95, score * 0.75 + 24)),
            Math.max(12, Math.min(95, score * 0.85 + 26)),
          ],
        };
      }).sort(
        (left, right) =>
          Number.parseInt(right.count.replaceAll(",", ""), 10) -
          Number.parseInt(left.count.replaceAll(",", ""), 10),
      ).slice(0, 10)
    : [];
  const growthRows = backendTopKeywords.length
    ? [...rankingRows].sort(
        (left, right) =>
          Number.parseFloat(right.growth) - Number.parseFloat(left.growth),
      )
    : [];
  const exportRankingRows = () => {
    downloadCsvFile("scholartrend-top-keywords-raw-count.csv", [
      ["Rank", "Keyword", "Count", "Trend 5y"],
      ...rankingRows.map((row, index) => [
        index + 1,
        row.keyword,
        row.count,
        Array.isArray(row.values) ? row.values.join(" | ") : "",
      ]),
    ]);
  };
  const exportGrowthRows = () => {
    downloadCsvFile("scholartrend-top-keywords-growth-rate.csv", [
      ["Rank", "Keyword", "Growth %"],
      ...growthRows.map((row, index) => [index + 1, row.keyword, row.growth]),
    ]);
  };

  return (
    <div className="trend-ranking-grid">
      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M5 7h14M5 12h14M5 17h14" /> Top 10 by Raw Count
            (Strategy A)
          </h2>
          <button type="button" onClick={exportRankingRows}>
            Export
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>Count</th>
              <th>Trend (5y)</th>
            </tr>
          </thead>
          <tbody>
            {rankingRows.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td>{row.count}</td>
                <td>
                  <TrendSparkline values={row.values} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <DataProvenance
          source="ScholarTrend calculated metrics"
          syncedAt={latestTimestamp(backendTopKeywords)}
          timestampLabel="Calculated"
        />
      </section>

      <section className="trend-panel trend-table-card">
        <div className="trend-table-heading">
          <h2>
            <MiniIcon path="M4 16.5 9 11l3.2 2.8L20 6.5M17 6.5h3v3" /> Top 10 by
            Growth Rate (Strategy B)
          </h2>
          <button type="button" onClick={exportGrowthRows}>
            Export
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Keyword</th>
              <th>
                Growth %
                <TrendScoreInfo
                  type="growth"
                  calculatedAt={latestTimestamp(backendTopKeywords)}
                />
              </th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {growthRows.map((row, index) => (
              <tr key={row.keyword}>
                <td>{index + 1}</td>
                <td>{row.keyword}</td>
                <td className="trend-positive">{row.growth}</td>
                <td>
                  <MiniIcon path="M12 19V5M7 10l5-5 5 5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <DataProvenance
          source="ScholarTrend calculated metrics"
          syncedAt={latestTimestamp(backendTopKeywords)}
          timestampLabel="Calculated"
        />
      </section>
    </div>
  );
}

function TrendVolumeMatrix({ filters = {} }) {
  const matrixQuery = buildTrendQuery(filters, {
    strategy: "StrategyA_RawCount",
  });
  const { data: backendTrendData } = useApiResource(
    `/api/trends?${matrixQuery}`,
    [],
    { select: unwrapList },
  );
  const matrixYears = backendTrendData.length
    ? [
        ...new Set(
          backendTrendData
            .map((item) => Number(item.year || item.Year))
            .filter(Boolean),
        ),
      ].sort((left, right) => left - right)
    : [];
  const matrixRows = backendTrendData.length
    ? Object.values(
        backendTrendData.reduce((acc, item) => {
          const keyword = item.keyword || item.Keyword || "Unknown keyword";
          const year = Number(item.year || item.Year);
          if (!acc[keyword]) {
            acc[keyword] = {
              discipline: keyword,
              values: matrixYears.map(() => 0),
              total: 0,
            };
          }
          const index = matrixYears.indexOf(year);
          const count = Number(
            item.publicationCount ?? item.PublicationCount ?? 0,
          );
          if (index >= 0) acc[keyword].values[index] += count;
          acc[keyword].total += count;
          return acc;
        }, {}),
      ).slice(0, 8)
    : [];

  return (
    <section className="trend-panel trend-matrix">
      <h2>Detailed Volume Matrix (Target: Machine Learning)</h2>
      <div className="trend-matrix-scroll">
        <table>
          <thead>
            <tr>
              <th>Discipline / Year</th>
              {matrixYears.map((year) => (
                <th key={year}>{year}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {matrixRows.map((row) => (
              <tr className={row.summary ? "summary" : ""} key={row.discipline}>
                <td>{row.discipline}</td>
                {row.values.map((value, index) => (
                  <td key={`${row.discipline}-${index}`}>{value}</td>
                ))}
                <td>{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DataProvenance
        source="ScholarTrend calculated metrics"
        syncedAt={latestTimestamp(backendTrendData)}
        timestampLabel="Calculated"
      />
    </section>
  );
}

function TrendKeywordsPage() {
  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trending Keywords"
      pageClassName="trend-tracking-page trend-keywords-page"
      mainClassName="trend-keywords-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search publications, authors, keywords..."
    >
      <div className="trend-content trend-keywords-content">
        <TrendKeywordsOverview />
      </div>
    </ResearcherShell>
  );
}

function TrendTrackingDashboardPage() {
  const currentTrendYear = new Date().getFullYear();
  const [trendFilters, setTrendFilters] = React.useState({
    keyword: "Machine Learning",
    journal: "",
    researchTopic: "",
    yearFrom: String(currentTrendYear - 4),
    yearTo: String(currentTrendYear),
    sourceApi: "",
    minCitations: "",
    maxCitations: "",
    sortBy: "citations",
  });
  const keyword = trendFilters.keyword;
  const dateRange = `${trendFilters.yearFrom}-${trendFilters.yearTo}`;
  const [showComparison, setShowComparison] = React.useState(false);
  const [comparisonDraft, setComparisonDraft] = React.useState("");
  const [comparisonKeyword, setComparisonKeyword] = React.useState("");
  const [compareMessage, setCompareMessage] = React.useState("");
  const trendFromYear = Number(trendFilters.yearFrom || currentTrendYear - 4);
  const trendToYear = Number(trendFilters.yearTo || currentTrendYear);
  const trendMetricQuery = buildTrendQuery(trendFilters);
  const { data: metricTrendRows } = useApiResource(
    `/api/trends?${trendMetricQuery}`,
    [],
    { select: unwrapList },
  );
  const liveTrendMetricCards = React.useMemo(() => {
    const countsByYear = metricTrendRows.reduce((result, row) => {
      const year = Number(row.year ?? row.Year);
      const count = Number(row.publicationCount ?? row.PublicationCount ?? 0);
      result[year] = (result[year] || 0) + count;
      return result;
    }, {});
    const yearlyCounts = Array.from(
      { length: Math.max(1, trendToYear - trendFromYear + 1) },
      (_, index) => countsByYear[trendFromYear + index] || 0,
    );
    const latest = yearlyCounts.at(-1) || 0;
    const previous = yearlyCounts.at(-2) || 0;
    const growth = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    const scores = metricTrendRows.map((row) =>
      Number(row.trendingScore ?? row.TrendingScore ?? 0),
    );
    const averageScore = scores.length
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    const maxCount = Math.max(...yearlyCounts, 1);
    const bars = yearlyCounts.map((count) =>
      count ? Math.max(12, Math.round((count / maxCount) * 90)) : 4,
    );
    return [
      {
        ...trendMetricDefinitions[0],
        value: yearlyCounts.reduce((sum, count) => sum + count, 0).toLocaleString(),
        bars,
      },
      {
        ...trendMetricDefinitions[1],
        value: `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`,
        note: `${trendToYear} vs ${trendToYear - 1}`,
        bars,
      },
      {
        ...trendMetricDefinitions[2],
        value: latest.toLocaleString(),
        note: `${trendToYear} raw count`,
        score: Math.min(100, latest),
        tooltipType: "raw",
        calculatedAt: latestTimestamp(metricTrendRows),
      },
      {
        ...trendMetricDefinitions[3],
        value: averageScore.toFixed(1),
        note: "API-calculated average",
        score: Math.max(0, Math.min(100, averageScore)),
        tooltipType: "growth",
        calculatedAt: latestTimestamp(metricTrendRows),
      },
    ];
  }, [metricTrendRows, trendFromYear, trendToYear]);

  const handleDateRangeChange = (e) => {
    const newRange = e.target.value;
    const [yearFrom, yearTo] = newRange.split("-");
    setTrendFilters((current) => ({ ...current, yearFrom, yearTo }));
  };

  const handleKeywordChange = (e) => {
    setTrendFilters((current) => ({ ...current, keyword: e.target.value }));
  };

  const handleClearKeyword = () => {
    setTrendFilters((current) => ({ ...current, keyword: "" }));
  };

  const handleCompareSubmit = (event) => {
    event.preventDefault();
    if (!showComparison) {
      setShowComparison(true);
      setCompareMessage("Enter a second keyword, then press Apply Compare.");
      return;
    }
    const nextKeyword = comparisonDraft.trim();
    if (!nextKeyword) {
      setCompareMessage("Enter a keyword to compare.");
      return;
    }
    if (nextKeyword.toLowerCase() === keyword.trim().toLowerCase()) {
      setCompareMessage("Choose a different keyword for comparison.");
      return;
    }
    setComparisonKeyword(nextKeyword);
    setCompareMessage(`Comparing ${keyword || "primary trend"} with ${nextKeyword}.`);
  };

  const clearComparison = () => {
    setShowComparison(false);
    setComparisonDraft("");
    setComparisonKeyword("");
    setCompareMessage("");
  };

  return (
    <ResearcherShell
      activeRoute="/researcher-trend-tracking"
      current="Trend Tracking"
      pageClassName="trend-tracking-page trend-dashboard-page"
      mainClassName="trend-tracking-main"
      breadcrumbRootLabel="Dashboard"
      breadcrumbRootPath="/researcher-dashboard"
      searchPlaceholder="Search keywords, authors..."
    >
      <div className="trend-content">
        <section className="trend-hero">
          <div>
            <h1>Trend Tracking</h1>
            <p>
              Analyze keyword velocity and raw publication volume across
              disciplines.
            </p>
          </div>
          <form
            className="trend-filter-panel"
            onSubmit={handleCompareSubmit}
          >
            <label className="trend-keyword-field">
              <MiniIcon path="M6 5h12M8 12h8M10 19h4" />
              <input
                type="search"
                value={keyword}
                onChange={handleKeywordChange}
                aria-label="Trend keyword"
              />
              <button
                type="button"
                aria-label="Clear keyword"
                onClick={handleClearKeyword}
              >
                x
              </button>
            </label>
            {showComparison ? (
              <label className="trend-keyword-field comparison-keyword-field">
                <MiniIcon path="M5 12h14M12 5v14" />
                <input
                  type="search"
                  value={comparisonDraft}
                  onChange={(event) => setComparisonDraft(event.target.value)}
                  aria-label="Comparison keyword"
                  placeholder="Comparison keyword"
                  autoFocus
                />
                <button
                  type="button"
                  aria-label="Remove comparison"
                  onClick={clearComparison}
                >
                  x
                </button>
              </label>
            ) : null}
            <div className="trend-filter-row">
              <label>
                <MiniIcon path="M7 4v3M17 4v3M5 9h14M6 6h12v13H6z" />
                <select
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  aria-label="Date range"
                >
                  <option value={`${currentTrendYear - 4}-${currentTrendYear}`}>
                    Last 5 Years ({currentTrendYear - 4}-{currentTrendYear})
                  </option>
                  <option value={`${currentTrendYear - 2}-${currentTrendYear}`}>
                    Last 3 Years ({currentTrendYear - 2}-{currentTrendYear})
                  </option>
                  <option value={`${currentTrendYear - 9}-${currentTrendYear}`}>
                    Last 10 Years ({currentTrendYear - 9}-{currentTrendYear})
                  </option>
                </select>
              </label>
              <button type="submit">
                {showComparison ? "Apply Compare" : "+ Compare"}
              </button>
            </div>
            {compareMessage ? (
              <p className="trend-compare-message" role="status">
                {compareMessage}
              </p>
            ) : null}
          </form>
        </section>

        <AcademicFilterBar
          filters={trendFilters}
          showKeyword={false}
          showSort={false}
          onChange={(patch) =>
            setTrendFilters((current) => ({ ...current, ...patch }))
          }
        />

        <section className="trend-metric-grid" aria-label="Trend metrics">
          {liveTrendMetricCards.map((card) => (
            <TrendMetricCard card={card} key={card.label} />
          ))}
        </section>

        <TrendMainChart
          dateRange={dateRange}
          keyword={keyword}
          comparisonKeyword={comparisonKeyword}
          filters={trendFilters}
        />
        <TrendRankingTables filters={trendFilters} />
        <TrendVolumeMatrix filters={trendFilters} />
      </div>
    </ResearcherShell>
  );
}

export { TrendMetricCard, TrendKeywordsOverview, TrendMainChart, TrendSparkline, TrendRankingTables, TrendVolumeMatrix, TrendKeywordsPage, TrendTrackingDashboardPage };
