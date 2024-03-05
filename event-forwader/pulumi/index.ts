import * as pulumi from "@pulumi/pulumi";
import * as resources from "@pulumi/azure-native/resources";
import * as storage from "@pulumi/azure-native/storage";
import * as azure_native from "@pulumi/azure-native";

// Create an Azure Resource Group
const resourceGroup = new resources.ResourceGroup("event-forwarder");

// Create the Event Grid Namespace
const namespace = new azure_native.eventgrid.Namespace("namespace", {
  namespaceName: "businessEvents",
  resourceGroupName: resourceGroup.name,
});

// Create the Event Grid Topic
const topic = new azure_native.eventgrid.NamespaceTopic("topic", {
  resourceGroupName: resourceGroup.name,
  namespaceName: namespace.name,
  topicName: "topicToForward1",
});

export const namespaceName = namespace.name;

