using System;
using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISimilarityService
{
    double CalculateSimilarity(string text1, string text2);
    Task<double> GetSimilarityScoreAsync(Guid pubId1, Guid pubId2);
    Task<bool> IsDuplicateRiskAsync(Guid pubId1, Guid pubId2);
}
