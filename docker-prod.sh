#!/bin/bash

# KesiMarket Modern Backend - Production Docker Management Script
# Usage: ./docker-prod.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"
DATA_PATH="/opt/kesimarket-modern/data"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root for production operations
check_root() {
    if [[ $EUID -ne 0 ]] && [[ "$1" == "deploy" ]]; then
        log_error "This script must be run as root for production deployment"
        exit 1
    fi
}

# Verify environment file exists
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Production environment file $ENV_FILE not found"
        log_info "Please create $ENV_FILE with production variables"
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log_info "Setting up production directories..."
    
    # Create data directories
    mkdir -p "$DATA_PATH"/{postgres,minio,redis}
    mkdir -p "$BACKUP_DIR"

    
    # Set proper permissions
    chmod 755 "$DATA_PATH"
    chmod 700 "$DATA_PATH"/postgres
    chmod 755 "$DATA_PATH"/{minio,redis}

    
    log_success "Directories created and permissions set"
}

# Generate strong secrets
generate_secrets() {
    log_info "Generating production secrets..."
    
    APP_KEY=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    echo "# Generated secrets - Add to your $ENV_FILE"
    echo "APP_KEY=$APP_KEY"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "REDIS_PASSWORD=$REDIS_PASSWORD"
    echo ""
    echo "# Database passwords (set your own)"
    echo "DB_PASSWORD=$(openssl rand -base64 32)"
    echo "MINIO_ROOT_USER=$(openssl rand -base64 16 | tr -d '/+=')"
    echo "MINIO_ROOT_PASSWORD=$(openssl rand -base64 32)"
}

# Build production images
build_production() {
    log_info "Building production images..."
    
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    log_success "Production images built successfully"
}

# Deploy to production
deploy_production() {
    check_root "deploy"
    check_env
    setup_directories
    
    log_info "Deploying to production..."
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Start services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be ready
    log_info "Waiting for services to start..."
    sleep 30
    
    # Run migrations
    log_info "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app node ace migration:run
    
    # Run seeders only if requested
    read -p "Run database seeders? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app node ace db:seed
    fi
    
    log_success "Production deployment completed!"
    show_status
}

# Stop production services
stop_production() {
    log_info "Stopping production services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "Production services stopped"
}

# Restart production services
restart_production() {
    log_info "Restarting production services..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    log_success "Production services restarted"
}

# Show production status
show_status() {
    log_info "Production services status:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    log_info "Service health:"
    echo "$(docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app curl -s http://localhost:${PORT:-3333}/health || echo 'API: DOWN')"
}

# View production logs
show_logs() {
    service=${2:-""}
    if [ -n "$service" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
    fi
}

# Create database backup
backup_database() {
    check_env
    
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    log_info "Creating database backup: $BACKUP_FILE"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db pg_dump -U ${DB_USER:-postgres} -d ${DB_DATABASE:-kesimarket_prod} > "$BACKUP_FILE"
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    log_success "Database backup created: ${BACKUP_FILE}.gz"
    
    # Clean old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +7 -delete
}

# Restore database from backup
restore_database() {
    check_env
    
    if [ -z "$2" ]; then
        log_error "Please specify backup file: $0 restore [backup-file]"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    log_warning "This will replace the current database. Are you sure?"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    log_info "Restoring database from: $BACKUP_FILE"
    
    # Decompress if needed
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db psql -U ${DB_USER:-postgres} -d ${DB_DATABASE:-kesimarket_prod}
    else
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db psql -U ${DB_USER:-postgres} -d ${DB_DATABASE:-kesimarket_prod} < "$BACKUP_FILE"
    fi
    
    log_success "Database restored successfully"
}

# Update production deployment
update_production() {
    check_env
    
    log_info "Updating production deployment..."
    
    # Create backup before update
    backup_database
    
    # Pull latest changes
    git pull origin main || log_warning "Could not pull latest changes"
    
    # Rebuild and restart
    build_production
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Run new migrations
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T app node ace migration:run
    
    log_success "Production updated successfully"
}

# Scale services
scale_services() {
    check_env
    
    if [ -z "$2" ]; then
        log_error "Please specify scaling: $0 scale app=2"
        exit 1
    fi
    
    log_info "Scaling services: $2"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --scale "$2"
    log_success "Services scaled successfully"
}

# Monitor resources
monitor() {
    log_info "Resource monitoring (press Ctrl+C to stop):"
    docker stats $(docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps -q)
}

# SSL certificate management
setup_ssl() {
    log_info "SSL certificate setup:"
    echo ""
    echo "For SSL certificates, you can use:"
    echo "1. Nginx with Let's Encrypt (manual setup)"
    echo "2. Cloudflare for SSL termination"
    echo "3. Load balancer SSL termination"
    echo ""
    echo "The application runs on port 3333 and can be proxied"
    echo "through any reverse proxy solution."
}

# Main command handling
case "${1:-help}" in
    "secrets")
        generate_secrets
        ;;
    "setup")
        setup_directories
        ;;
    "build")
        build_production
        ;;
    "deploy")
        deploy_production
        ;;
    "stop")
        stop_production
        ;;
    "restart")
        restart_production
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs "$@"
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$@"
        ;;
    "update")
        update_production
        ;;
    "scale")
        scale_services "$@"
        ;;
    "monitor")
        monitor
        ;;
    "ssl")
        setup_ssl
        ;;
    "help"|*)
        echo "KesiMarket Modern Backend - Production Docker Management"
        echo ""
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Setup Commands:"
        echo "  secrets   - Generate production secrets"
        echo "  setup     - Create production directories"
        echo "  build     - Build production images"
        echo "  deploy    - Full production deployment"
        echo ""
        echo "Management Commands:"
        echo "  stop      - Stop production services"
        echo "  restart   - Restart production services"
        echo "  status    - Show services status"
        echo "  logs      - Show logs [service]"
        echo "  update    - Update production deployment"
        echo "  scale     - Scale services (e.g., app=2)"
        echo ""
        echo "Maintenance Commands:"
        echo "  backup    - Create database backup"
        echo "  restore   - Restore database [backup-file]"
        echo "  monitor   - Monitor resource usage"
        echo "  ssl       - SSL certificate setup help"
        echo ""
        echo "Prerequisites:"
        echo "  - Create $ENV_FILE with production variables"
        echo "  - Run 'secrets' command to generate secure keys"
        echo "  - Run 'setup' command to create directories"
        echo ""
        echo "Examples:"
        echo "  $0 secrets > secrets.txt    # Generate secrets"
        echo "  $0 deploy                   # Full deployment"
        echo "  $0 backup                   # Create backup"
        echo "  $0 logs app                 # View app logs"
        echo "  $0 scale app=3              # Scale to 3 instances"
        ;;
esac 