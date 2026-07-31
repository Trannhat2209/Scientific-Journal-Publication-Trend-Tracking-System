using System.Collections.Concurrent;

namespace ScientificJournal.DataAccess.External;

public sealed class ExternalApiRateLimiter
{
    private readonly ConcurrentDictionary<string, Queue<DateTime>> _windows = new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new(StringComparer.OrdinalIgnoreCase);
    private volatile int _requestsPerMinute = 120;

    public int RequestsPerMinute => _requestsPerMinute;

    public void Configure(int requestsPerMinute) =>
        _requestsPerMinute = Math.Clamp(requestsPerMinute, 1, 6000);

    public async Task WaitAsync(string source, CancellationToken cancellationToken = default)
    {
        var gate = _locks.GetOrAdd(source, _ => new SemaphoreSlim(1, 1));
        while (true)
        {
            TimeSpan delay;
            await gate.WaitAsync(cancellationToken);
            try
            {
                var now = DateTime.UtcNow;
                var window = _windows.GetOrAdd(source, _ => new Queue<DateTime>());
                while (window.Count > 0 && now - window.Peek() >= TimeSpan.FromMinutes(1))
                    window.Dequeue();

                if (window.Count < _requestsPerMinute)
                {
                    window.Enqueue(now);
                    return;
                }

                delay = TimeSpan.FromMinutes(1) - (now - window.Peek());
            }
            finally
            {
                gate.Release();
            }

            if (delay > TimeSpan.Zero)
                await Task.Delay(delay, cancellationToken);
        }
    }
}
