using System;
using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface ISimilarityService
{
    double CalculateSimilarity(string text1, string text2);
    Task<double> GetSimilarityScoreAsync(int pubId1, int pubId2);
    Task<bool> IsDuplicateRiskAsync(int pubId1, int pubId2);
}
