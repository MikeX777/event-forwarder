import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as azure_native from "@pulumi/azure-native";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("event-forwarder");

// Create the Event Grid Namespace
const eventGridNamespaceName = "businessEvents";
const namespace = new azure_native.eventgrid.Namespace(eventGridNamespaceName, {
  namespaceName: eventGridNamespaceName,
  resourceGroupName: resourceGroup.name,
  publicNetworkAccess: "Enabled",
  topicSpacesConfiguration: {
    state: "Enabled"
  }
});

// Create the Event Grid Topic
const topicName = "topicToForward1";
const topic = new azure_native.eventgrid.NamespaceTopic(topicName, {
  resourceGroupName: resourceGroup.name,
  namespaceName: namespace.name,
  topicName: topicName,
});

const serviceBusNamespaceName = "forwadingServiceBusNamespace";
const serviceBusNamespace = new azure_native.servicebus.Namespace(serviceBusNamespaceName, {
  namespaceName: serviceBusNamespaceName,
  resourceGroupName: resourceGroup.name,
});

// Create a forward queue to receive the event grid events.
const forwardQueueName = "ForwardQueue";
const forwardQueue = new azure_native.servicebus.Queue(forwardQueueName, {
  enablePartitioning: true,
  requiresSession: true,
  lockDuration: "PT5M",
  maxDeliveryCount: 5,
  maxSizeInMegabytes: 1024,
  deadLetteringOnMessageExpiration: true,
  enableBatchedOperations: true,
  defaultMessageTimeToLive: "P7D",
  resourceGroupName: resourceGroup.name,
  namespaceName: serviceBusNamespace.name,
  //  queueName: forwardQueueName,
});

// Create a broadcast queue to broadcast events as they arrive.
const broadcastQueueName = "BroadcastQueue";
const broadcastQueue = new azure_native.servicebus.Queue(broadcastQueueName, {
  enablePartitioning: true,
  resourceGroupName: resourceGroup.name,
  namespaceName: serviceBusNamespace.name,
  queueName: broadcastQueueName,
});

//// Create an event subscription that receives the evnents
//const forwardQueueSubscriptionName = "ForwardQueueSubscription";
//const forwardQueueSubscription = new azure_native.eventgrid.EventSubscription(forwardQueueSubscriptionName, {
//  //eventSubscriptionName: forwardQueueSubscriptionName,
//  scope: topic.id,
//  destination: {
//    endpointType: "ServiceBusQueue",
//    resourceId: forwardQueue.id,
//    deliveryAttributeMappings: [
//      {
//        name: "SessionId",
//        type: "Static",
//        value: "SessionId",
//        isSecret: false,
//        sourceField: ""
//      }
//    ]
//  },
//  filter: {
//    isSubjectCaseSensitive: false,
//    includedEventTypes: [
//      "Microsoft.EventGrid.MQTTClientSessionConnected",
//      "Microsoft.EventGrid.MQTTClientSessionDisconnected",
//      "Microsoft.EventGrid.MQTTClientCreatedOrUpdated",
//      "Microsoft.EventGrid.MQTTClientDeleted"
//    ],
//    // includedEventTypes: null,
//  },
//  eventDeliverySchema: "EventGridSchema"
//});

// Create storage account for function App
const eventForwarderStorageAccountName = "evtfdrsa567";
const eventForwarderStorageAccount = new azure_native.storage.StorageAccount(eventForwarderStorageAccountName, {
  accountName: eventForwarderStorageAccountName,
  kind: azure_native.storage.Kind.StorageV2,
  resourceGroupName: resourceGroup.name,
  sku: {
    name: azure_native.storage.SkuName.Standard_LRS,
  },
});

// Create storage container for the code for the function app
const codeContainerName = "codecontainer1321";
const codeContainer = new azure_native.storage.BlobContainer(codeContainerName, {
  accountName: eventForwarderStorageAccount.name,
  containerName: codeContainerName,
  resourceGroupName: resourceGroup.name,
});

// Create app plan for function app
const appPlanName = "functionAppPlan";
const appServicePlan = new azure_native.web.AppServicePlan(appPlanName, {
  resourceGroupName: resourceGroup.name,
  kind: "FunctionApp",
  sku: {
    capacity: 1,
    family: "S",
    name: "S1",
    size: "S1",
    tier: "Standard",
  },
});

// Create Function App to Deploy to
const functionAppName = "EventForwarderFunctionApp";
const functionApp = new azure_native.web.WebApp(functionAppName, {
  name: functionAppName,
  resourceGroupName: resourceGroup.name,
  serverFarmId: appServicePlan.id,
  kind: "functionapp",
});

export const namespaceName = namespace.name;
export const functionEndpoint = pulumi.interpolate`https://${functionApp.defaultHostName}/api/${functionAppName}`;
export const forwardQueueResourceId = forwardQueue.id;
export const topicId = topic.id;

