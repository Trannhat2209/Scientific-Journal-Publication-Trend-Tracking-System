using System;

namespace ScientificJournal.Common.DTOs.Response.Publication;

public class RelatedPublicationDto
{
    public int PublicationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public double SimilarityScore { get; set; }
    public bool IsDuplicateRisk { get; set; }
}
