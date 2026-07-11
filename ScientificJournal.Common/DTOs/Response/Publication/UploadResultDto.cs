namespace ScientificJournal.Common.DTOs.Response.Publication;

public class UploadResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? PublicationId { get; set; }
    public double GoogleScholarDuplicationScore { get; set; }
    public double InternalDuplicationScore { get; set; }
}
