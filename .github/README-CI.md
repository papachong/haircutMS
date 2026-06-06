# CI/CD Setup

This directory contains the GitHub Actions workflow for continuous integration and deployment.

## Workflow: `ci-cd.yml`

### Triggers
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### Jobs

1. **Lint & Type Check**
   - Runs ESLint
   - Runs TypeScript type checking
   - Runs on every commit and PR

2. **Build & Test**
   - Installs dependencies
   - Builds all packages
   - Generates Prisma client
   - Runs database migrations
   - Builds Next.js app

3. **Build Docker Images**
   - Builds and pushes Docker images to GitHub Container Registry
   - Only runs on push to main/develop branches
   - Tags images with branch name and SHA

4. **Deploy to Production**
   - Deploys to production server
   - Only runs on push to `main` branch
   - Performs health check after deployment

5. **Deploy to Staging**
   - Deploys to staging server
   - Only runs on push to `develop` branch
   - Performs health check after deployment

## Required Secrets

Add these secrets in GitHub repository settings:

### Production
- `DEPLOY_HOST` - Production server hostname
- `DEPLOY_USER` - SSH username
- `DEPLOY_SSH_KEY` - Private SSH key

### Staging (optional)
- `STAGING_DEPLOY_HOST` - Staging server hostname
- `STAGING_DEPLOY_USER` - SSH username
- `STAGING_DEPLOY_SSH_KEY` - Private SSH key

## Environment Variables

Configure `.env.production` on the server with:
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `WEB_IMAGE`, `SERVER_IMAGE`

See `.env.production.template` for reference.
