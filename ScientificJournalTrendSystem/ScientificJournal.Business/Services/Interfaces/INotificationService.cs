using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ScientificJournal.Business.Services.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<string>> GetNotificationsAsync(Guid userId);
}
