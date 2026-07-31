using System;

namespace ScientificJournal.Common.DTOs.Response.Dashboard;

public class DashboardStatsDto
{
    public int TotalPublications { get; set; }
    public int TotalKeywords { get; set; }
    public int TotalUsers { get; set; }
    public DateTime? RecentSyncAt { get; set; }
}
