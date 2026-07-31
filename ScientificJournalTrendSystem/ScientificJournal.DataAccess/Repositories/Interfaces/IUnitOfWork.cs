using System;
using System.Threading.Tasks;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync();
}
