using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationKeyword
{
    public int PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public int KeywordId { get; set; }
    public Keyword? Keyword { get; set; }
}
