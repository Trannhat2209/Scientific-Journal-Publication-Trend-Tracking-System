using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationKeyword
{
    public Guid PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public Guid KeywordId { get; set; }
    public Keyword? Keyword { get; set; }
}
