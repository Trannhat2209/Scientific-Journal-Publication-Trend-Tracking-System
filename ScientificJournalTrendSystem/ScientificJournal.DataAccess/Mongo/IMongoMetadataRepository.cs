using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.Mongo;

public interface IMongoMetadataRepository
{
    Task<PublicationRawMetadata?> GetByIdAsync(string id);
    Task<PublicationRawMetadata?> GetByDoiAsync(string doi, string sourceApi);
    Task<string> InsertAsync(PublicationRawMetadata metadata);
    Task UpdateAsync(PublicationRawMetadata metadata);
    Task DeleteAsync(string id);
}
