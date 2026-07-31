using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.DataAccess.Entities;

namespace ScientificJournal.DataAccess.Repositories.Interfaces;

public interface INotificationRepository : IGenericRepository<Notification>
{
    Task<IEnumerable<Notification>> GetUnreadByUserAsync(int userId);
}
