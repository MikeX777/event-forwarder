using infrastructure.Models;

namespace infrastructure.Interfaces
{
    public interface IEventNotificationService
    {
        Task Broadcast(EventMessage message);
    }
}
