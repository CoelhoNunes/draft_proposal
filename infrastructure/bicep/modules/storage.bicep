/**
 * @fileoverview Storage Account module for file storage and CDN
 */

@description('The location for the Storage Account')
param location string

@description('The environment name')
param environment string

@description('The application name')
param appName string

@description('The resource suffix for uniqueness')
param resourceSuffix string

@description('The Key Vault name for storing connection strings')
param keyVaultName string

// Generate Storage Account name (must be globally unique and lowercase)
var storageAccountName = '${replace(appName, '-', '')}${environment}${resourceSuffix}'

// Deploy Storage Account
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: {
    Application: appName
    Environment: environment
    Component: 'Storage'
  }
  sku: {
    name: environment == 'prod' ? 'Standard_LRS' : 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// Deploy blob containers
resource documentsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::storageAccount::blobServices
  name: 'documents'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Document storage for MicroTech platform'
    }
  }
}

resource exportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::storageAccount::blobServices
  name: 'exports'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Exported files storage'
    }
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::storageAccount::blobServices
  name: 'uploads'
  properties: {
    publicAccess: 'None'
    metadata: {
      purpose: 'Temporary upload storage'
    }
  }
}

resource staticContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: storageAccount::storageAccount::blobServices
  name: '$web'
  properties: {
    publicAccess: 'Blob'
    metadata: {
      purpose: 'Static website hosting'
    }
  }
}

// Get storage account keys
resource listKeys 'Microsoft.Storage/storageAccounts/listKeys@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

// Store connection string in Key Vault
resource connectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: '${keyVaultName}/storage-connection-string'
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${listKeys.keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
    contentType: 'text/plain'
  }
}

// Outputs
output storageAccountName string = storageAccount.name
output storageAccountResourceId string = storageAccount.id
output storageAccountConnectionString string = listKeys.keys[0].value
output storageAccountPrimaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
output storageAccountSecondaryEndpoint string = storageAccount.properties.secondaryEndpoints.blob
