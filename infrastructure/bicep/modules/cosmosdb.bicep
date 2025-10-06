/**
 * @fileoverview Cosmos DB module for data storage
 */

@description('The location for the Cosmos DB account')
param location string

@description('The environment name')
param environment string

@description('The application name')
param appName string

@description('The resource suffix for uniqueness')
param resourceSuffix string

@description('The Key Vault name for storing connection strings')
param keyVaultName string

// Generate Cosmos DB account name (must be globally unique and lowercase)
var cosmosDbAccountName = '${replace(appName, '-', '')}-${environment}-${resourceSuffix}'

// Deploy Cosmos DB Account
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosDbAccountName
  location: location
  tags: {
    Application: appName
    Environment: environment
    Component: 'CosmosDB'
  }
  kind: 'GlobalDocumentDB'
  properties: {
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    databaseAccountOfferType: environment == 'prod' ? 'Standard' : 'Standard'
    enableAutomaticFailover: environment == 'prod'
    enableMultipleWriteLocations: false
    isVirtualNetworkFilterEnabled: false
    virtualNetworkRules: []
    ipRules: []
    enableFreeTier: environment != 'prod'
    apiProperties: {
      serverVersion: '4.0'
    }
    enableAnalyticalStorage: false
    analyticalStorageConfiguration: {
      schemaType: 'WellDefined'
    }
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
        backupStorageRedundancy: 'Geo'
      }
    }
    capabilities: []
    disableKeyBasedMetadataWriteAccess: false
    networkAclBypass: 'None'
    networkAclBypassResourceIds: []
    publicNetworkAccess: 'Enabled'
    enablePartitionKeyMonitor: false
    enableBurstCapacity: environment == 'prod'
    capacity: environment == 'prod' ? {
      totalThroughputLimit: 1000
    } : null
  }
}

// Create database
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: 'microtech'
  properties: {
    resource: {
      id: 'microtech'
    }
    options: {
      throughput: environment == 'prod' ? 400 : 400
      autoscaleSettings: environment == 'prod' ? {
        maxThroughput: 4000
      } : null
    }
  }
}

// Create containers
resource usersContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'users'
  properties: {
    resource: {
      id: 'users'
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      uniqueKeyPolicy: {
        uniqueKeys: [
          {
            paths: ['/email']
          }
        ]
      }
    }
    options: {
      throughput: 400
    }
  }
}

resource workspacesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'workspaces'
  properties: {
    resource: {
      id: 'workspaces'
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: ['/ownerId']
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

resource documentsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'documents'
  properties: {
    resource: {
      id: 'documents'
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: ['/workspaceId']
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

resource checklistContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'checklist'
  properties: {
    resource: {
      id: 'checklist'
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: ['/workspaceId']
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

resource changesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'changes'
  properties: {
    resource: {
      id: 'changes'
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      partitionKey: {
        paths: ['/workspaceId']
        kind: 'Hash'
      }
    }
    options: {
      throughput: 400
    }
  }
}

// Get connection strings
resource listConnectionStrings 'Microsoft.DocumentDB/databaseAccounts/listConnectionStrings@2023-04-15' = {
  parent: cosmosDbAccount
  name: 'default'
}

// Store connection string in Key Vault
resource connectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: '${keyVaultName}/cosmosdb-connection-string'
  properties: {
    value: listConnectionStrings.connectionStrings[0].connectionString
    contentType: 'text/plain'
  }
}

// Store primary key in Key Vault
resource primaryKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  name: '${keyVaultName}/cosmosdb-key'
  properties: {
    value: listConnectionStrings.connectionStrings[0].connectionString
    contentType: 'text/plain'
  }
}

// Outputs
output cosmosDbAccountName string = cosmosDbAccount.name
output cosmosDbResourceId string = cosmosDbAccount.id
output cosmosDbConnectionString string = listConnectionStrings.connectionStrings[0].connectionString
output cosmosDbPrimaryKey string = listConnectionStrings.connectionStrings[0].connectionString
output cosmosDbEndpoint string = cosmosDbAccount.properties.documentEndpoint
