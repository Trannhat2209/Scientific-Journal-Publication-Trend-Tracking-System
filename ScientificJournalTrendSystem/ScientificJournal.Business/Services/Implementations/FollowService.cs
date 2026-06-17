using System;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Services.Implementations;

public class FollowService : IFollowService
{
    public Task FollowKeywordAsync(Guid userId, Guid keywordId)
    {
        return Task.CompletedTask;
    }

    public Task UnfollowKeywordAsync(Guid userId, Guid keywordId)
    {
        return Task.CompletedTask;
    }
}
