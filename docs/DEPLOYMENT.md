# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on the server
- GitHub account with a repository
- SSH access to the deployment server
- Domain name with SSL certificates

## Setup Instructions

### 1. Generate Secrets

Generate secure secrets for production:

```bash
# JWT secrets
openssl rand -base64 32

# Database password
openssl rand -base64 16

# Redis password
openssl rand -base64 16
```

### 2. Prepare the Server

SSH into your deployment server:

```bash
ssh user@your-server.com
```

Create the deployment directory:

```bash
sudo mkdir -p /opt/haircutms
sudo chown $USER:$USER /opt/haircutms
cd /opt/haircutms
```

Clone or copy the project files:

```bash
git clone git@github.com:your-username/haircutMS.git .
```

### 3. Configure Environment Variables

Copy the environment template and configure:

```bash
cp .env.production.template .env.production
nano .env.production
```

Update the following values:
- `POSTGRES_PASSWORD` - Set a strong password
- `REDIS_PASSWORD` - Set a strong password
- `JWT_SECRET` - Set a strong secret
- `JWT_REFRESH_SECRET` - Set a strong secret
- `WEB_IMAGE` - Update with your registry path
- `SERVER_IMAGE` - Update with your registry path

### 4. Setup SSL Certificates

Using Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./nginx/ssl/key.pem
sudo chown $USER:$USER ./nginx/ssl/*
```

For self-signed certificates (development only):

```bash
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem
```

### 5. Configure GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions):

For Production:
- `DEPLOY_HOST` - Your server hostname/IP
- `DEPLOY_USER` - SSH username
- `DEPLOY_SSH_KEY` - Private SSH key for deployment

For Staging (optional):
- `STAGING_DEPLOY_HOST` - Staging server hostname/IP
- `STAGING_DEPLOY_USER` - SSH username
- `STAGING_DEPLOY_SSH_KEY` - Private SSH key for staging

### 6. Setup SSH Key on Server

Generate SSH key on GitHub Actions machine (or use existing):

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
```

Add the public key to the server's `~/.ssh/authorized_keys`:

```bash
cat ~/.ssh/github_actions.pub | ssh user@your-server.com 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys'
```

Add the private key to GitHub secrets.

### 7. Deploy

#### Manual Deployment

```bash
cd /opt/haircutms
docker-compose -f docker/docker-compose.prod.yml pull
docker-compose -f docker/docker-compose.prod.yml up -d
```

#### Automatic Deployment

Push to `main` branch for production or `develop` for staging. The GitHub Actions workflow will:

1. Lint and type check the code
2. Run tests
3. Build Docker images
4. Push to Container Registry
5. Deploy to the server

### 8. Verify Deployment

Check the deployment status:

```bash
# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# Check health
curl https://your-domain.com/health
curl https://your-domain.com/api/v1/health
```

## Docker Compose Commands

```bash
# Start services
docker-compose -f docker/docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker/docker-compose.prod.yml down

# View logs
docker-compose -f docker/docker-compose.prod.yml logs

# Follow logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# Restart services
docker-compose -f docker/docker-compose.prod.yml restart

# Update services
docker-compose -f docker/docker-compose.prod.yml pull
docker-compose -f docker/docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f

# View status
docker-compose -f docker/docker-compose.prod.yml ps
```

## Troubleshooting

### Services not starting

Check logs for each service:

```bash
docker-compose -f docker/docker-compose.prod.yml logs postgres
docker-compose -f docker/docker-compose.prod.yml logs redis
docker-compose -f docker/docker-compose.prod.yml logs server
docker-compose -f docker/docker-compose.prod.yml logs web
docker-compose -f docker/docker-compose.prod.yml logs nginx
```

### Database connection errors

Verify PostgreSQL is running:

```bash
docker-compose -f docker/docker-compose.prod.yml ps postgres
```

Check environment variables in `.env.production`.

### SSL certificate errors

Ensure certificates are in the correct location with proper permissions:

```bash
ls -la nginx/ssl/
# Should show cert.pem and key.pem with correct owner
```

### Prisma migration issues

Run migrations manually:

```bash
docker-compose -f docker/docker-compose.prod.yml exec server npx prisma migrate deploy
```

### Port conflicts

Ensure ports 80, 443, 3000, 4000, 5432, and 6379 are not already in use:

```bash
netstat -tuln | grep -E ':(80|443|3000|4000|5432|6379)'
```

## Monitoring

### Check service health

```bash
# Nginx
curl http://localhost/health

# Web
curl http://localhost:3000/health

# Server
curl http://localhost:4000/health
```

### View resource usage

```bash
docker stats
```

## Backups

### Database backup

```bash
docker-compose -f docker/docker-compose.prod.yml exec postgres pg_dump -U haircutms haircutms > backup_$(date +%Y%m%d).sql
```

### Restore database

```bash
docker-compose -f docker/docker-compose.prod.yml exec -T postgres psql -U haircutms haircutms < backup_20240101.sql
```

## Security Checklist

- [ ] Strong passwords for all secrets
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured (only allow necessary ports)
- [ ] Regular security updates applied
- [ ] Database backups automated
- [ ] Access logs monitored
- [ ] Rate limiting enabled (in nginx config)
- [ ] CORS configured properly
- [ ] Environment variables not committed to git