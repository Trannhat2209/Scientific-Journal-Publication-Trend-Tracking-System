using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace ScientificJournal.DataAccess.Mongo;

public class PublicationRawMetadata
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("doi")]
    public string Doi { get; set; } = string.Empty;

    [BsonElement("sourceApi")]
    public string SourceApi { get; set; } = string.Empty;

    [BsonElement("rawData")]
    public string RawData { get; set; } = string.Empty;

    [BsonElement("syncedAt")]
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;
}
