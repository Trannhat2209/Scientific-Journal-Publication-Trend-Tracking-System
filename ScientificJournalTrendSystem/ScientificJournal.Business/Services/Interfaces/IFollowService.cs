using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IFollowService
{
    Task FollowKeywordAsync(int userId, int keywordId);
    Task UnfollowKeywordAsync(int userId, int keywordId);
    Task FollowJournalAsync(int userId, int journalId);
    Task UnfollowJournalAsync(int userId, int journalId);
    Task<IEnumerable<Follow>> GetUserFollowsAsync(int userId);
}

