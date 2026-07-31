using System;
using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public class CappedSimilarityDto
{
    public double OriginalScore { get; set; }
    public double DisplayScore { get; set; }
    public double LimitApplied { get; set; }
    public bool IsCapped { get; set; }
    public string Message { get; set; } = string.Empty;
}

public interface ISimilarityService
{
    double CalculateSimilarity(string text1, string text2);
    Task<double> GetSimilarityScoreAsync(int pubId1, int pubId2);
    Task<bool> IsDuplicateRiskAsync(int pubId1, int pubId2);
    Task<CappedSimilarityDto> GetSimilarityResultAsync(int pubId1, int pubId2);
}
