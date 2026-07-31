using System.Collections.Generic;

namespace ScientificJournal.Common.Helpers;

public static class SimilarityHelper
{
    public static double CalculateJaccardSimilarity(HashSet<string> set1, HashSet<string> set2)
    {
        if (set1 == null || set2 == null || (set1.Count == 0 && set2.Count == 0))
            return 0.0;

        int intersectionCount = 0;
        foreach (var item in set1)
        {
            if (set2.Contains(item))
            {
                intersectionCount++;
            }
        }

        int unionCount = set1.Count + set2.Count - intersectionCount;
        if (unionCount == 0) return 0.0;

        return (double)intersectionCount / unionCount;
    }
}
