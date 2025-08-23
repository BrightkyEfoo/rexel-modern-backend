#!/bin/bash

# KesiMarket Modern Backend - Docker Management Script
# Usage: ./docker-start.sh [command]

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

# Functions
init_env() {
    log_info "Initializing environment..."
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            cp env.example .env
            log_success "Created .env file from env.example"
            log_warning "Please edit .env file with your actual configuration"
        else
            log_error "No env.example file found"
            exit 1
        fi
    else
        log_info ".env file already exists"
    fi
}

build_services() {
    log_info "Building Docker services..."
    docker-compose build --no-cache
    log_success "Services built successfully"
}

start_services() {
    log_info "Starting Docker services..."
    docker-compose up -d --build
    log_success "Services started successfully"
}

stop_services() {
    log_info "Stopping Docker services..."
    docker-compose down
    log_success "Services stopped successfully"
}

restart_services() {
    log_info "Restarting Docker services..."
    docker-compose restart
    log_success "Services restarted successfully"
}

show_logs() {
    log_info "Showing logs..."
    docker-compose logs -f
}

show_status() {
    log_info "Docker services status:"
    docker-compose ps
}

run_migrations() {
    log_info "Running database migrations..."
    docker-compose exec app node ace migration:run
    log_success "Migrations completed"
}

run_seeders() {
    log_info "Running database seeders..."
    docker-compose exec app node ace db:seed
    log_success "Seeders completed"
}

setup_database() {
    log_info "Setting up database..."
    run_migrations
    run_seeders
    log_success "Database setup completed"
}

clean_volumes() {
    log_warning "This will remove all Docker volumes (database data will be lost)"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Stopping services..."
        docker-compose down -v
        log_info "Removing volumes..."
        docker volume prune -f
        log_success "Volumes cleaned"
    else
        log_info "Operation cancelled"
    fi
}

install_deps() {
    log_info "Installing dependencies..."
    docker-compose exec app npm install
    log_success "Dependencies installed"
}

shell_access() {
    log_info "Opening shell in app container..."
    docker-compose exec app sh
}

full_setup() {
    log_info "Running full setup..."
    init_env
    build_services
    start_services
    
    log_info "Waiting for services to be ready..."
    sleep 10
    
    setup_database
    log_success "Full setup completed!"
    log_info "Application should be available at http://localhost:\${PORT:-3333}"
    log_info "MinIO Console available at http://localhost:\${MINIO_CONSOLE_PORT:-9001} (admin credentials in .env)"
}

# Main command handling
case "${1:-help}" in
    "init")
        init_env
        ;;
    "build")
        build_services
        ;;
    "start")
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "migrate")
        run_migrations
        ;;
    "seed")
        run_seeders
        ;;
    "setup-db")
        setup_database
        ;;
    "clean")
        clean_volumes
        ;;
    "install")
        install_deps
        ;;
    "shell")
        shell_access
        ;;
    "setup")
        full_setup
        ;;
    "help"|*)
        echo "KesiMarket Modern Backend - Docker Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  init      - Initialize .env file from template"
        echo "  build     - Build Docker services"
        echo "  start     - Start Docker services"
        echo "  stop      - Stop Docker services"
        echo "  restart   - Restart Docker services"
        echo "  logs      - Show service logs"
        echo "  status    - Show services status"
        echo "  migrate   - Run database migrations"
        echo "  seed      - Run database seeders"
        echo "  setup-db  - Run migrations and seeders"
        echo "  clean     - Clean Docker volumes (removes data)"
        echo "  install   - Install npm dependencies"
        echo "  shell     - Open shell in app container"
        echo "  setup     - Full setup (init + build + start + setup-db)"
        echo "  help      - Show this help"
        echo ""
        echo "Examples:"
        echo "  $0 setup     # Complete setup from scratch"
        echo "  $0 start     # Start services"
        echo "  $0 logs      # View logs"
        echo "  $0 shell     # Access container shell"
        ;;
esac 