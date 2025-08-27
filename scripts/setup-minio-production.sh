#!/bin/bash

# MinIO Production Setup Script
# Usage: ./scripts/setup-minio-production.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-.env}"

# Check if we're in the right directory
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Docker compose file $COMPOSE_FILE not found. Make sure you're in the project root."
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "Environment file $ENV_FILE not found."
    exit 1
fi

# Detect if sudo is needed for Docker commands
USE_SUDO=""
if ! docker ps &> /dev/null; then
    if sudo docker ps &> /dev/null; then
        log_warning "Using sudo for Docker commands"
        USE_SUDO="sudo "
    else
        log_error "Docker not accessible even with sudo"
        exit 1
    fi
else
    log_info "Docker accessible without sudo"
fi

# Function to wait for MinIO to be ready
wait_for_minio() {
    log_info "Waiting for MinIO to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "MinIO check attempt $attempt/$max_attempts..."
        
        if ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T minio curl -f http://localhost:9000/minio/health/live >/dev/null 2>&1; then
            log_success "MinIO is ready!"
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                log_error "MinIO failed to start after $max_attempts attempts"
                ${USE_SUDO}docker compose -f "$COMPOSE_FILE" logs minio
                return 1
            fi
            log_info "MinIO not ready yet, waiting 3 seconds..."
            sleep 3
        fi
        attempt=$((attempt + 1))
    done
}

# Function to wait for application to be ready
wait_for_app() {
    log_info "Waiting for application to be ready..."
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "App check attempt $attempt/$max_attempts..."
        
        if ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T app node ace list >/dev/null 2>&1; then
            log_success "Application is ready!"
            return 0
        else
            if [ $attempt -eq $max_attempts ]; then
                log_error "Application failed to start after $max_attempts attempts"
                ${USE_SUDO}docker compose -f "$COMPOSE_FILE" logs app
                return 1
            fi
            log_info "Application not ready yet, waiting 3 seconds..."
            sleep 3
        fi
        attempt=$((attempt + 1))
    done
}

# Main setup function
setup_minio() {
    log_info "🚀 Starting MinIO setup for production..."
    
    # Wait for services to be ready
    wait_for_minio || exit 1
    wait_for_app || exit 1
    
    # Check MinIO configuration
    log_info "📋 Checking MinIO configuration..."
    if ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T app node ace minio:check; then
        log_success "MinIO configuration check passed!"
    else
        log_warning "MinIO configuration check failed, but continuing..."
    fi
    
    # Setup MinIO buckets
    log_info "📦 Setting up MinIO buckets..."
    if ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T app node ace minio:setup; then
        log_success "MinIO buckets created successfully!"
    else
        log_error "MinIO bucket setup failed!"
        return 1
    fi
    
    # Final verification
    log_info "🔍 Final verification..."
    if ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T app node ace minio:check; then
        log_success "✅ MinIO setup completed successfully!"
        return 0
    else
        log_error "❌ MinIO verification failed!"
        return 1
    fi
}

# Check if services are running
check_services() {
    log_info "Checking if required services are running..."
    
    local minio_running=$(${USE_SUDO}docker compose -f "$COMPOSE_FILE" ps -q minio)
    local app_running=$(${USE_SUDO}docker compose -f "$COMPOSE_FILE" ps -q app)
    
    if [ -z "$minio_running" ]; then
        log_error "MinIO service is not running. Start services with: docker compose -f $COMPOSE_FILE up -d"
        exit 1
    fi
    
    if [ -z "$app_running" ]; then
        log_error "Application service is not running. Start services with: docker compose -f $COMPOSE_FILE up -d"
        exit 1
    fi
    
    log_success "Required services are running"
}

# Main execution
main() {
    log_info "MinIO Production Setup Script"
    log_info "Using compose file: $COMPOSE_FILE"
    log_info "Using environment file: $ENV_FILE"
    
    check_services
    setup_minio
    
    if [ $? -eq 0 ]; then
        log_success "🎉 MinIO setup completed successfully!"
        log_info "💡 You can now upload files to MinIO through your application"
    else
        log_error "💥 MinIO setup failed!"
        exit 1
    fi
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "check")
        check_services
        wait_for_app || exit 1
        ${USE_SUDO}docker compose -f "$COMPOSE_FILE" exec -T app node ace minio:check
        ;;
    "help"|*)
        echo "MinIO Production Setup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  setup  - Full MinIO setup (default)"
        echo "  check  - Check MinIO configuration"
        echo "  help   - Show this help"
        echo ""
        echo "Environment Variables:"
        echo "  COMPOSE_FILE - Docker compose file (default: docker-compose.prod.yml)"
        echo "  ENV_FILE     - Environment file (default: .env)"
        echo ""
        echo "Examples:"
        echo "  $0                                    # Full setup"
        echo "  $0 check                              # Check configuration"
        echo "  COMPOSE_FILE=docker-compose.yml $0    # Use development compose"
        ;;
esac
