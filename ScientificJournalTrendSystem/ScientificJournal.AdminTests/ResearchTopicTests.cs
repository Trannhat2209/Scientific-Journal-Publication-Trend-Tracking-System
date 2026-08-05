using Microsoft.EntityFrameworkCore;
using ScientificJournal.Business.Services.Implementations;
using ScientificJournal.Business.Services.Interfaces;
using ScientificJournal.Common.Enums;
using ScientificJournal.DataAccess.Context;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.AdminTests;

public sealed class ResearchTopicTests
{
    [Fact]
    public async Task Following_topic_drives_publication_recommendations_and_can_be_removed()
    {
        await using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var user = new User { Email = "topic@test.edu", FullName = "Topic User", PasswordHash = "hash", Role = UserRole.Student };
        var topic = new ResearchTopic { Name = "Machine Learning", NormalizedName = "machine learning" };
        var keyword = new Keyword { Term = "Neural Networks", NormalizedTerm = "neural networks", ResearchTopic = topic };
        var publication = new Publication { Title = "A topic paper", DOI = "10.1/topic", Year = 2026, SourceApi = "Crossref", CitationCount = 9 };
        context.AddRange(user, topic, keyword, publication);
        context.PublicationKeywords.Add(new PublicationKeyword { Publication = publication, Keyword = keyword });
        await context.SaveChangesAsync();

        var follows = new FollowService(context);
        await follows.FollowTopicAsync(user.Id, topic.Id);

        Assert.Contains(await follows.GetUserFollowsAsync(user.Id), f => f.FollowType == FollowType.Topic && f.FollowTargetId == topic.Id);
        var recommendations = await new RecommendationService(context, new SimilarityStub()).GetRecommendationsForUserAsync(user.Id, 5);
        Assert.Contains(recommendations, item => item.Id == publication.Id);

        await follows.UnfollowTopicAsync(user.Id, topic.Id);
        Assert.DoesNotContain(await follows.GetUserFollowsAsync(user.Id), f => f.FollowType == FollowType.Topic);
    }

    private sealed class SimilarityStub : ISimilarityService
    {
        public double CalculateSimilarity(string text1, string text2) => 0;
        public Task<double> GetSimilarityScoreAsync(int pubId1, int pubId2) => Task.FromResult(0d);
        public Task<bool> IsDuplicateRiskAsync(int pubId1, int pubId2) => Task.FromResult(false);
        public Task<CappedSimilarityDto> GetSimilarityResultAsync(int pubId1, int pubId2) => Task.FromResult(new CappedSimilarityDto());
    }
}
