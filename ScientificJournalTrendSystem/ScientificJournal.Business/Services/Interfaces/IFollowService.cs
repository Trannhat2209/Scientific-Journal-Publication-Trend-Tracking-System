using System;
using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface IFollowService
{
    Task FollowKeywordAsync(Guid userId, Guid keywordId);
    Task UnfollowKeywordAsync(Guid userId, Guid keywordId);
}
