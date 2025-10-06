# Deployment Guide

## Overview

This guide covers deploying the MicroTech platform to Azure, including infrastructure provisioning, application deployment, and monitoring setup.

## Prerequisites

- Azure CLI installed and configured
- GitHub repository with Actions enabled
- Azure subscription with appropriate permissions

## Infrastructure Deployment

### 1. Resource Group Setup
```bash
az group create --name rg-microtech-prod --location eastus
```

### 2. Deploy Infrastructure
```bash
cd infrastructure/bicep
az deployment group create \
  --resource-group rg-microtech-prod \
  --template-file main.bicep \
  --parameters environment=prod
```

### 3. Configure Key Vault Secrets
```bash
az keyvault secret set \
  --vault-name microtech-kv-prod \
  --name "openai-api-key" \
  --value "your-openai-api-key"

az keyvault secret set \
  --vault-name microtech-kv-prod \
  --name "jwt-secret" \
  --value "your-jwt-secret"
```

## Application Deployment

### 1. Configure GitHub Secrets
Add the following secrets to your GitHub repository:
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `AZURE_WEBAPP_PUBLISH_PROFILE`
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### 2. Deploy via GitHub Actions
1. Push changes to main branch
2. GitHub Actions will automatically:
   - Build the applications
   - Run tests
   - Deploy to Azure

### 3. Manual Deployment (if needed)
```bash
# Build and deploy web app
cd apps/web
pnpm build
az staticwebapp deploy \
  --name microtech-web-prod \
  --resource-group rg-microtech-prod \
  --source-location apps/web/dist

# Build and deploy API
cd apps/api
pnpm build
az webapp deployment source config-zip \
  --resource-group rg-microtech-prod \
  --name microtech-api-prod \
  --src apps/api/dist.zip
```

## Monitoring and Maintenance

### 1. Application Insights
- Monitor application performance
- Track errors and exceptions
- Analyze user behavior

### 2. Log Analytics
- Centralized logging
- Custom queries and alerts
- Performance monitoring

### 3. Health Checks
- Configure health check endpoints
- Set up alerts for failures
- Monitor key metrics

## Security Considerations

1. **Network Security**
   - Use Azure Front Door for DDoS protection
   - Configure WAF rules
   - Enable SSL/TLS encryption

2. **Access Control**
   - Use Azure Entra ID for authentication
   - Implement role-based access control
   - Regular access reviews

3. **Data Protection**
   - Encrypt data at rest and in transit
   - Use Azure Key Vault for secrets
   - Regular security audits

## Scaling and Performance

1. **Auto-scaling**
   - Configure auto-scaling rules
   - Monitor resource utilization
   - Set up alerts for scaling events

2. **CDN**
   - Use Azure CDN for static assets
   - Configure caching policies
   - Monitor CDN performance

3. **Database Optimization**
   - Monitor query performance
   - Implement proper indexing
   - Regular maintenance tasks

## Troubleshooting

### Common Issues

1. **Deployment Failures**
   - Check GitHub Actions logs
   - Verify Azure permissions
   - Review resource quotas

2. **Performance Issues**
   - Check Application Insights
   - Monitor resource utilization
   - Review database performance

3. **Security Issues**
   - Review access logs
   - Check for vulnerabilities
   - Update dependencies regularly

### Support Contacts

- Azure Support: [Azure Portal](https://portal.azure.com)
- GitHub Support: [GitHub Support](https://support.github.com)
- Internal Team: [Internal Support Channel]
