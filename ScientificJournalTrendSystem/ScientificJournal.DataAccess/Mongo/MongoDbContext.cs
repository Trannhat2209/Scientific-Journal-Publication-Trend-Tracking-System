using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using ScientificJournal.Common.Constants;

namespace ScientificJournal.DataAccess.Mongo;

public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IConfiguration configuration)
    {
        var connectionString = configuration[AppSettings.MongoConnectionString] ?? "mongodb://localhost:27017";
        var dbName = configuration["ConnectionStrings:MongoDatabaseName"] ?? "scientific_journal_raw_db";

        var settings = MongoClientSettings.FromConnectionString(connectionString);
        settings.ConnectTimeout = TimeSpan.FromSeconds(2);
        settings.ServerSelectionTimeout = TimeSpan.FromSeconds(2);
        var client = new MongoClient(settings);
        _database = client.GetDatabase(dbName);
    }

    public IMongoCollection<T> GetCollection<T>(string name)
    {
        return _database.GetCollection<T>(name);
    }

    public IMongoCollection<PublicationRawMetadata> PublicationRawMetadata => 
        GetCollection<PublicationRawMetadata>("publication_raw_metadata");
}
