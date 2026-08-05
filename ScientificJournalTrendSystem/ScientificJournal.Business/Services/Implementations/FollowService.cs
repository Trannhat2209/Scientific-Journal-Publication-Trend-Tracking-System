using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Implementations;

public class FollowService : IFollowService
{
    private readonly AppDbContext _context;

    public FollowService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Follow>> GetUserFollowsAsync(int userId)
    {
        return await _context.Follows
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .ToListAsync();
    }

    public async Task FollowKeywordAsync(int userId, int keywordId)
    {
        var exists = await _context.Follows.AnyAsync(f => f.UserId == userId && f.FollowType == FollowType.Keyword && f.FollowTargetId == keywordId);
        if (exists) return;

        var keyword = await _context.Keywords.FindAsync(keywordId);
        if (keyword == null) return;

        var follow = new Follow
        {
            UserId = userId,
            FollowType = FollowType.Keyword,
            FollowTargetId = keywordId,
            FollowTargetName = keyword.Term,
            CreatedAt = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();
    }

    public async Task UnfollowKeywordAsync(int userId, int keywordId)
    {
        var follow = await _context.Follows.FirstOrDefaultAsync(f => f.UserId == userId && f.FollowType == FollowType.Keyword && f.FollowTargetId == keywordId);
        if (follow != null)
        {
            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();
        }
    }

    public async Task FollowJournalAsync(int userId, int journalId)
    {
        var exists = await _context.Follows.AnyAsync(f => f.UserId == userId && f.FollowType == FollowType.Journal && f.FollowTargetId == journalId);
        if (exists) return;

        var journal = await _context.Journals.FindAsync(journalId);
        if (journal == null) return;

        var follow = new Follow
        {
            UserId = userId,
            FollowType = FollowType.Journal,
            FollowTargetId = journalId,
            FollowTargetName = journal.Name,
            CreatedAt = DateTime.UtcNow
        };

        _context.Follows.Add(follow);
        await _context.SaveChangesAsync();
    }

    public async Task UnfollowJournalAsync(int userId, int journalId)
    {
        var follow = await _context.Follows.FirstOrDefaultAsync(f => f.UserId == userId && f.FollowType == FollowType.Journal && f.FollowTargetId == journalId);
        if (follow != null)
        {
            _context.Follows.Remove(follow);
            await _context.SaveChangesAsync();
        }
    }

    public async Task FollowTopicAsync(int userId, int topicId)
    {
        var topic = await _context.ResearchTopics.AsNoTracking().FirstOrDefaultAsync(t => t.Id == topicId && t.IsActive);
        if (topic == null) throw new KeyNotFoundException("Research topic was not found.");
        if (await _context.Follows.AnyAsync(f => f.UserId == userId && f.FollowType == FollowType.Topic && f.FollowTargetId == topicId)) return;
        _context.Follows.Add(new Follow { UserId = userId, FollowType = FollowType.Topic, FollowTargetId = topicId, FollowTargetName = topic.Name, CreatedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
    }

    public async Task UnfollowTopicAsync(int userId, int topicId)
    {
        var follow = await _context.Follows.FirstOrDefaultAsync(f => f.UserId == userId && f.FollowType == FollowType.Topic && f.FollowTargetId == topicId);
        if (follow == null) return;
        _context.Follows.Remove(follow);
        await _context.SaveChangesAsync();
    }
}

