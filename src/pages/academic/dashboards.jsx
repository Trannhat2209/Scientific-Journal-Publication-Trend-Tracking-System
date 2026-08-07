// Generated module from the former App.jsx.
import React from "react";
import AcademicFilterBar from "../../components/academic/AcademicFilterBar";
import { buildTrendQuery, latestTimestamp } from "../../services/academic-query";
import useAcademicFilters from "../../hooks/useAcademicFilters";
import { MiniIcon, formatCount, getCurrentAccountPlan, getPublishedPublications, getSessionDisplayName, navTo, normalizeRoleForUi, publicationGrowthData, researcherStats, unwrapList, useApiResource } from "../../app/core.jsx";
import { LecturerPublicationsCard, LecturerStatCard, LecturerTrendingCard, PublicationGrowthChart, RecentlyPublishedCard, ResearchDomainsCard, ResearcherShell, ResearcherStatCard, TrendingKeywordsCard, lecturerStats } from "./shell.jsx";

function LecturerDashboard() {
  const [exported, setExported] = React.useState(false);
  const { filters, updateFilters, resetFilters } = useAcademicFilters();
  const session = getCurrentAccountPlan();
  const displayName = getSessionDisplayName(session, "Lecturer");
  const displayRole = normalizeRoleForUi(session.role || "Lecturer");
  const publishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );

  return (
    <ResearcherShell
      activeRoute="/lecturer-dashboard"
      topbar="lecturer"
      pageClassName="lecturer-dashboard-page"
      mainClassName="lecturer-dashboard-main"
    >
      <div className="lecturer-dashboard-content">
        <div className="lecturer-welcome-row">
          <div>
            <div className="lecturer-title-row">
              <h1>Welcome back, {displayName}</h1>
              <span>{displayRole}</span>
            </div>
            <p>
              Here is the latest analytical intelligence for your tracked
              disciplines.
            </p>
          </div>
          <button
            type="button"
            className="lecturer-export-button"
            onClick={() => setExported(true)}
          >
            <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
            {exported ? "Report Exported" : "Export Report"}
          </button>
        </div>

        <AcademicFilterBar filters={filters} onChange={updateFilters} showReset onReset={resetFilters} />

        <section className="lecturer-stat-grid" aria-label="Lecturer metrics">
          {lecturerStats.map((stat) => (
            <LecturerStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="lecturer-dashboard-grid">
          <LecturerTrendingCard filters={filters} />
          <LecturerPublicationsCard
            publishedPublications={publishedPublications}
            filters={filters}
          />
        </div>
      </div>
    </ResearcherShell>
  );
}

function ResearcherDashboard() {
  const { filters, updateFilters, resetFilters } = useAcademicFilters();
  const { data: statsData } = useApiResource("/api/dashboard/stats", null);
  const publishedPublications = React.useMemo(
    () => getPublishedPublications(),
    [],
  );
  const { data: growthData } = useApiResource(
    "/api/dashboard/growth",
    publicationGrowthData,
    {
      select: (payload) => {
        const mapped = unwrapList(payload).map((item) => ({
          year: item.year || item.Year,
          publications: item.count || item.Count || 0,
        }));
        return mapped.length ? mapped : publicationGrowthData;
      },
    },
  );
  const dashboardTrendQuery = buildTrendQuery(filters);
  const { data: keywordData } = useApiResource(
    `/api/trends?${dashboardTrendQuery}`,
    [],
    {
      select: (payload) => {
        const byKeyword = unwrapList(payload).reduce((result, item) => {
          const label = item.keyword || item.Keyword;
          const score = Number(item.trendingScore ?? item.TrendingScore ?? 0);
          if (!label) return result;
          if (!result[label] || score > result[label].score) {
            result[label] = {
              label,
              score,
              calculatedAt: item.calculatedAt || item.CalculatedAt,
            };
          }
          return result;
        }, {});
        return Object.values(byKeyword)
          .sort((left, right) => right.score - left.score)
          .slice(0, 5)
          .map((item) => ({
            ...item,
            percent: `${item.score.toFixed(1)}%`,
            width: `${Math.max(12, Math.min(100, item.score))}%`,
          }));
      },
    },
  );
  const dashboardStats = React.useMemo(() => {
    if (!statsData) return researcherStats;
    return researcherStats.map((stat) => {
      if (stat.label === "admin.totalPublications") {
        return { ...stat, value: formatCount(statsData.totalPublications) };
      }
      if (stat.label === "New This Week") {
        return {
          ...stat,
          value: formatCount(statsData.totalKeywords),
          note: "Tracked keywords",
        };
      }
      return stat;
    });
  }, [statsData]);

  return (
    <ResearcherShell activeRoute="/researcher-dashboard" current="Dashboard">
      <div className="researcher-content">
        <div className="researcher-intro-row">
          <p>Here's your latest academic intelligence overview.</p>
          <a
            href="/researcher-search"
            className="researcher-date-filter"
            onClick={navTo("/researcher-search")}
          >
            <MiniIcon path="M7 7h10M9 12h6M11 17h2" />
            Advanced search
          </a>
        </div>

        <AcademicFilterBar
          filters={filters}
          onChange={updateFilters}
          showKeyword={false}
          showJournal={false}
          showCitations={false}
          showSort={false}
          showReset
          onReset={resetFilters}
          className="researcher-dashboard-filters"
        />

        <section className="researcher-stats" aria-label="Researcher metrics">
          {dashboardStats.map((stat) => (
            <ResearcherStatCard stat={stat} key={stat.label} />
          ))}
        </section>

        <div className="researcher-dashboard-grid">
          <PublicationGrowthChart data={growthData} syncedAt={latestTimestamp(growthData, "syncedAt")} />
          <aside className="researcher-side-column">
            <TrendingKeywordsCard keywords={keywordData} />
            <RecentlyPublishedCard publications={publishedPublications} />
            <ResearchDomainsCard />
          </aside>
        </div>
      </div>

      <button
        type="button"
        className="researcher-download"
        aria-label="Download report"
      >
        <MiniIcon path="M12 4v10M8 10l4 4 4-4M5 19h14" />
      </button>
    </ResearcherShell>
  );
}

export { LecturerDashboard, ResearcherDashboard };
