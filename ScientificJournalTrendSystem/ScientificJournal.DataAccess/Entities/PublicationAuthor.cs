using System;

namespace ScientificJournal.DataAccess.Entities;

public class PublicationAuthor
{
    public Guid PublicationId { get; set; }
    public Publication? Publication { get; set; }
    public Guid AuthorId { get; set; }
    public Author? Author { get; set; }
    public int AuthorOrder { get; set; }
}
