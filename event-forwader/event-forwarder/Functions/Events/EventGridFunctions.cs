// Default URL for triggering event grid function in the local environment.
// http://localhost:7071/runtime/webhooks/EventGrid?functionName={functionname}
using Azure.Messaging.EventGrid;
using Azure.Messaging.ServiceBus;
using infrastructure.Interfaces;
using infrastructure.Models;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.EventGrid;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;

namespace event_forwarder.Functions.Events
{
    public class EventGridFunctions
    {
        private readonly IEventNotificationService eventNotificationService;

        public EventGridFunctions(IEventNotificationService eventNotificationService) => this.eventNotificationService = eventNotificationService;
        [FunctionName(nameof(EventGridForwarder))]
        public static async Task EventGridForwarder(
            [EventGridTrigger] EventGridEvent eventGridEvent,
            ILogger log,
            [ServiceBus("%ServiceBusConfiguration:BroadcastQueueName%", Connection = "ServiceBusConfiguration")] IAsyncCollector<ServiceBusMessage> collector)
        {
            var serviceBusMessage = new ServiceBusMessage(eventGridEvent.ToString());
            await collector.AddAsync(serviceBusMessage);
        }


        [FunctionName(nameof(EventBroadcaster))]
        public async Task EventBroadcaster(
            [ServiceBusTrigger("%ServiceBusConfiguration:BroadcastQueueName%", Connection = "ServiceBusConfiguration")] ServiceBusReceivedMessage message,
            ILogger log)
        {
            try
            {
                var eventGridEvent = EventGridEvent.Parse(message.Body);
                var eventMessage = new EventMessage
                {
                    Data = eventGridEvent.Data,
                };
                await eventNotificationService.Broadcast(eventMessage);
            }
            catch
            {
                log.LogError("There was an error processing the queue messsge.");
            }
        }
    }
}
