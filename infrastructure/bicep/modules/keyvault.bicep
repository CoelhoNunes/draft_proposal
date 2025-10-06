/**
 * @fileoverview Key Vault module for secure secret storage
 */

@description('The location for the Key Vault')
param location string

@description('The environment name')
param environment string

@description('The application name')
param appName string

@description('The resource suffix for uniqueness')
param resourceSuffix string

@description('The admin email for access policies')
param adminEmail string

// Generate Key Vault name (must be globally unique)
var keyVaultName = '${appName}-kv-${environment}-${resourceSuffix}'

// Deploy Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  tags: {
    Application: appName
    Environment: environment
    Component: 'KeyVault'
  }
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: environment == 'prod' ? 'premium' : 'standard'
    }
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: subscription().subscriptionId // Will be replaced with actual user/principal ID
        permissions: {
          keys: ['Get', 'List', 'Update', 'Create', 'Import', 'Delete', 'Recover', 'Backup', 'Restore']
          secrets: ['Get', 'List', 'Set', 'Delete', 'Recover', 'Backup', 'Restore']
          certificates: ['Get', 'List', 'Update', 'Create', 'Import', 'Delete', 'Recover', 'Backup', 'Restore']
        }
      }
    ]
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: false
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 7
    enablePurgeProtection: environment == 'prod'
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
    publicNetworkAccess: 'Enabled'
  }
}

// Store secrets in Key Vault
resource storageAccountKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'storage-account-key'
  properties: {
    value: 'PLACEHOLDER-STORAGE-KEY'
    contentType: 'text/plain'
  }
}

resource cosmosDbKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'cosmosdb-key'
  properties: {
    value: 'PLACEHOLDER-COSMOS-KEY'
    contentType: 'text/plain'
  }
}

resource jwtSecretSecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'jwt-secret'
  properties: {
    value: 'PLACEHOLDER-JWT-SECRET'
    contentType: 'text/plain'
  }
}

resource openaiApiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    value: 'PLACEHOLDER-OPENAI-KEY'
    contentType: 'text/plain'
  }
}

// Outputs
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultResourceId string = keyVault.id
