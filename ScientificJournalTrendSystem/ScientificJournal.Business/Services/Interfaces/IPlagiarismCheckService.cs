using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public class PlagiarismReportDto
{
    public bool IsPassed { get; set; }
    public double DuplicationPercentage { get; set; }
    public string MatchingSource { get; set; } = string.Empty;
}

public interface IPlagiarismCheckService
{
    Task<PlagiarismReportDto> CheckPlagiarismAsync(string title, string abstractText);
}
