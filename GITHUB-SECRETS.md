# GitHub Secrets Configuration for KesiMarket Backend

This document lists all the required GitHub secrets for the backend deployment.

## Required Secrets

### Database Configuration
- `DB_USER`: PostgreSQL database user
- `DB_PASSWORD`: PostgreSQL database password  
- `DB_DATABASE`: PostgreSQL database name

### MinIO Object Storage
- `MINIO_ACCESS_KEY`: MinIO access key
- `MINIO_SECRET_KEY`: MinIO secret key
- `MINIO_BUCKET`: MinIO bucket name
- `MINIO_PUBLIC_ENDPOINT`: MinIO public endpoint URL
- `MINIO_ROOT_USER`: MinIO root user
- `MINIO_ROOT_PASSWORD`: MinIO root password

### Authentication & Security
- `APP_KEY`: AdonisJS application key (32 characters)
- `JWT_SECRET`: JWT secret key (64+ characters)

### Redis Cache
- `REDIS_PASSWORD`: Redis password

### CORS Configuration
- `CORS_ORIGINS`: Comma-separated list of allowed origins

### Email Configuration
- `SMTP_HOST`: SMTP server host (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP server port (e.g., 587)
- `SMTP_USERNAME`: SMTP username/email
- `SMTP_PASSWORD`: SMTP password/app password
- `SMTP_FROM`: From email address
- `MAIL_USERNAME`: Email username for authentication
- `GOOGLE_APP_SECRET`: Google application secret for email services

### Frontend Configuration
- `FRONTEND_URL`: Frontend application URL

### VPS Configuration
- `VPS_HOST`: VPS hostname or IP address
- `VPS_USER`: VPS username
- `VPS_SSH_PRIVATE_KEY`: SSH private key for VPS access 