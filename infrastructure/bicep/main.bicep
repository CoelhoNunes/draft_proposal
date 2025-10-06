/**
 * @fileoverview Main Bicep template for MicroTech Platform Azure infrastructure
 */

@description('The location for all resources')
param location string = resourceGroup().location

@description('The environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('The application name')
param appName string = 'microtech'

@description('The version of the application')
param appVersion string = '1.0.0'

@description('The admin email for notifications')
param adminEmail string

@description('The domain name for the application')
param domainName string = ''

@description('Whether to enable diagnostic logging')
param enableDiagnostics bool = true

@description('Whether to enable Application Insights')
param enableApplicationInsights bool = true

// Generate resource names
var resourcePrefix = '${appName}-${environment}'
var resourceSuffix = '${uniqueString(resourceGroup().id)}'

// Deploy resource group tags
resource resourceGroupTags 'Microsoft.Resources/tags@2021-04-01' = {
  name: 'default'
  properties: {
    tags: {
      Application: appName
      Environment: environment
      Version: appVersion
      ManagedBy: 'Bicep'
      CreatedDate: utcNow('yyyy-MM-dd')
    }
  }
}

// Deploy Key Vault
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    adminEmail: adminEmail
  }
}

// Deploy Storage Account
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    keyVaultName: keyVault.outputs.keyVaultName
  }
}

// Deploy Cosmos DB
module cosmosdb 'modules/cosmosdb.bicep' = {
  name: 'cosmosdb'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    keyVaultName: keyVault.outputs.keyVaultName
  }
}

// Deploy Application Insights
module applicationInsights 'modules/applicationinsights.bicep' = {
  name: 'applicationinsights'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    enableApplicationInsights: enableApplicationInsights
  }
}

// Deploy App Service Plan
module appServicePlan 'modules/appserviceplan.bicep' = {
  name: 'appserviceplan'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
  }
}

// Deploy API App Service
module apiApp 'modules/appservice.bicep' = {
  name: 'api'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    keyVaultName: keyVault.outputs.keyVaultName
    storageAccountName: storage.outputs.storageAccountName
    cosmosDbConnectionString: cosmosdb.outputs.cosmosDbConnectionString
    applicationInsightsConnectionString: applicationInsights.outputs.applicationInsightsConnectionString
    appType: 'api'
  }
}

// Deploy Web App Service
module webApp 'modules/appservice.bicep' = {
  name: 'web'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    keyVaultName: keyVault.outputs.keyVaultName
    storageAccountName: storage.outputs.storageAccountName
    cosmosDbConnectionString: cosmosdb.outputs.cosmosDbConnectionString
    applicationInsightsConnectionString: applicationInsights.outputs.applicationInsightsConnectionString
    appType: 'web'
  }
}

// Deploy CDN Profile
module cdn 'modules/cdn.bicep' = {
  name: 'cdn'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    storageAccountName: storage.outputs.storageAccountName
    webAppHostName: webApp.outputs.appServiceHostName
    domainName: domainName
  }
}

// Deploy monitoring and alerting
module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring'
  params: {
    location: location
    environment: environment
    appName: appName
    resourceSuffix: resourceSuffix
    adminEmail: adminEmail
    apiAppName: apiApp.outputs.appServiceName
    webAppName: webApp.outputs.appServiceName
    storageAccountName: storage.outputs.storageAccountName
    cosmosDbAccountName: cosmosdb.outputs.cosmosDbAccountName
    applicationInsightsName: applicationInsights.outputs.applicationInsightsName
    enableDiagnostics: enableDiagnostics
  }
}

// Outputs
output resourceGroupName string = resourceGroup().name
output location string = location
output environment string = environment

output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri

output storageAccountName string = storage.outputs.storageAccountName
output storageAccountConnectionString string = storage.outputs.storageAccountConnectionString

output cosmosDbAccountName string = cosmosdb.outputs.cosmosDbAccountName
output cosmosDbConnectionString string = cosmosdb.outputs.cosmosDbConnectionString

output apiAppName string = apiApp.outputs.appServiceName
output apiAppUrl string = apiApp.outputs.appServiceUrl
output webAppName string = webApp.outputs.appServiceName
output webAppUrl string = webApp.outputs.appServiceUrl

output cdnEndpoint string = cdn.outputs.cdnEndpoint
output cdnUrl string = cdn.outputs.cdnUrl

output applicationInsightsName string = applicationInsights.outputs.applicationInsightsName
output applicationInsightsConnectionString string = applicationInsights.outputs.applicationInsightsConnectionString

output monitoringResourceGroup string = monitoring.outputs.monitoringResourceGroup
