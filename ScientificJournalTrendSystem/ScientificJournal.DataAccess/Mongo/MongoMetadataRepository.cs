using MongoDB.Driver;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.Mongo;

public class MongoMetadataRepository : IMongoMetadataRepository
{
    private readonly MongoDbContext _context;

    public MongoMetadataRepository(MongoDbContext context)
    {
        _context = context;
    }

    public async Task<PublicationRawMetadata?> GetByIdAsync(string id)
    {
        return await _context.PublicationRawMetadata
            .Find(x => x.Id == id)
            .FirstOrDefaultAsync();
    }

    public async Task<PublicationRawMetadata?> GetByDoiAsync(string doi, string sourceApi)
    {
        return await _context.PublicationRawMetadata
            .Find(x => x.Doi == doi && x.SourceApi == sourceApi)
            .FirstOrDefaultAsync();
    }

    public async Task<string> InsertAsync(PublicationRawMetadata metadata)
    {
        await _context.PublicationRawMetadata.InsertOneAsync(metadata);
        return metadata.Id!;
    }

    public async Task UpdateAsync(PublicationRawMetadata metadata)
    {
        await _context.PublicationRawMetadata.ReplaceOneAsync(x => x.Id == metadata.Id, metadata);
    }

    public async Task DeleteAsync(string id)
    {
        await _context.PublicationRawMetadata.DeleteOneAsync(x => x.Id == id);
    }
}
