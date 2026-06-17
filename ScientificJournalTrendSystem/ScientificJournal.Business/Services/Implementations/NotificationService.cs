using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ScientificJournal.Business.Services.Interfaces;

namespace ScientificJournal.Business.Services.Implementations;

public class NotificationService : INotificationService
{
    public Task<IEnumerable<string>> GetNotificationsAsync(Guid userId)
    {
        return Task.FromResult<IEnumerable<string>>(new List<string>());
    }
}
