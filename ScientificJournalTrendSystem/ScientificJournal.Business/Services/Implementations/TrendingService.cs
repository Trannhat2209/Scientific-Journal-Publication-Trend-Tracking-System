using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.DTOs.Request.Trend;
using ScientificJournal.Common.DTOs.Response.Trend;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class TrendingService : ITrendingService
{
    private readonly AppDbContext _context;

    public TrendingService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TrendingMetricDto>> GetTrendingScoreAsync(TrendQueryRequestDto request)
    {
        var query = _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null)
            .AsQueryable();

        if (request.FromYear > 0)
        {
            query = query.Where(m => m.Year >= request.FromYear);
        }

        if (request.ToYear > 0)
        {
            query = query.Where(m => m.Year <= request.ToYear);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            query = query.Where(m => m.Keyword!.Term.Contains(request.Keyword) || m.Keyword.NormalizedTerm.Contains(request.Keyword));
        }

        return await query
            .OrderByDescending(m => m.TrendingScore)
            .ThenByDescending(m => m.PublicationCount)
            .Select(m => new TrendingMetricDto
            {
                Keyword = m.Keyword!.Term,
                Year = m.Year,
                PublicationCount = m.PublicationCount,
                TrendingScore = (double)(m.TrendingScore ?? 0)
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<TopKeywordDto>> GetTopKeywordsAsync(int count)
    {
        return await _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null)
            .GroupBy(m => new { m.KeywordId, m.Keyword!.Term })
            .Select(g => new TopKeywordDto
            {
                Keyword = g.Key.Term,
                TotalCount = g.Sum(x => x.PublicationCount),
                TrendingScore = (double)(g.Average(x => x.TrendingScore) ?? 0)
            })
            .OrderByDescending(x => x.TrendingScore)
            .ThenByDescending(x => x.TotalCount)
            .Take(count)
            .ToListAsync();
    }

    public async Task<IEnumerable<object>> GetKeywordTrendHistoryAsync(int keywordId)
    {
        var data = await _context.TrendingMetrics
            .Where(m => m.KeywordId == keywordId)
            .OrderBy(m => m.Year)
            .Select(m => new
            {
                Year = m.Year,
                Count = m.PublicationCount,
                Score = m.TrendingScore
            })
            .ToListAsync();

        return data.Select(x => (object)x).ToList();
    }

    public async Task<IEnumerable<object>> GetTrendingKeywordsAsync(int limit)
    {
        var data = await _context.TrendingMetrics
            .Include(m => m.Keyword)
            .Where(m => m.Keyword != null)
            .OrderByDescending(m => m.TrendingScore)
            .ThenByDescending(m => m.PublicationCount)
            .Take(limit)
            .Select(m => new
            {
                KeywordId = m.KeywordId,
                KeywordTerm = m.Keyword!.Term,
                Year = m.Year,
                PublicationCount = m.PublicationCount,
                TrendingScore = m.TrendingScore
            })
            .ToListAsync();

        return data.Select(x => (object)x).ToList();
    }

    public async Task RecalculateTrendingMetricsAsync()
    {
        var pubKeywords = await _context.PublicationKeywords
            .Include(pk => pk.Publication)
            .Where(pk => pk.Publication != null && !pk.Publication.IsDeleted)
            .Select(pk => new
            {
                pk.KeywordId,
                pk.Publication!.Year
            })
            .ToListAsync();

        var keywordYearCounts = pubKeywords
            .GroupBy(x => new { x.KeywordId, x.Year })
            .Select(g => new
            {
                g.Key.KeywordId,
                g.Key.Year,
                Count = g.Count()
            })
            .ToList();

        var metricsToSave = new List<TrendingMetric>();

        foreach (var kwCount in keywordYearCounts)
        {
            var prevYearCount = keywordYearCounts
                .Where(x => x.KeywordId == kwCount.KeywordId && x.Year == kwCount.Year - 1)
                .Select(x => x.Count)
                .FirstOrDefault();

            var score = (decimal)(((double)kwCount.Count - prevYearCount) / (prevYearCount + 1.0) * 100.0);
            score = Math.Round(score, 2);

            var metric = new TrendingMetric
            {
                KeywordId = kwCount.KeywordId,
                Year = kwCount.Year,
                PublicationCount = kwCount.Count,
                TrendingScore = score,
                CalculatedAt = DateTime.UtcNow
            };
            metricsToSave.Add(metric);
        }

        foreach (var metric in metricsToSave)
        {
            var existing = await _context.TrendingMetrics
                .FirstOrDefaultAsync(m => m.KeywordId == metric.KeywordId && m.Year == metric.Year);

            if (existing != null)
            {
                existing.PublicationCount = metric.PublicationCount;
                existing.TrendingScore = metric.TrendingScore;
                existing.CalculatedAt = metric.CalculatedAt;
            }
            else
            {
                _context.TrendingMetrics.Add(metric);
            }
        }

        await _context.SaveChangesAsync();
    }
}

