using System.Collections.Generic;

namespace ScientificJournal.Common.DTOs.Response.Publication;

public class PublicationDetailDto
{
    public PublicationDto Publication { get; set; } = new();
    public List<RelatedPublicationDto> RelatedPublications { get; set; } = new();
}
