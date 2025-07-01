#!/bin/bash

# 🛠️ Rexel Modern Backend - Deployment Utilities
# Script d'aide pour la gestion du déploiement sur VPS

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_PATH="$HOME/rexel-modern/backend"
COMPOSE_FILE="docker-compose.prod.yml"
APP_NAME="rexel-backend-prod"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si nous sommes dans le bon répertoire
check_deployment_directory() {
    if [ ! -f "$DEPLOY_PATH/$COMPOSE_FILE" ]; then
        log_error "Fichier $COMPOSE_FILE non trouvé dans $DEPLOY_PATH"
        log_info "Assurez-vous d'être dans le bon répertoire de déploiement"
        exit 1
    fi
    cd "$DEPLOY_PATH"
}

# Afficher le statut des services
show_status() {
    log_info "État des services Rexel Modern"
    echo "----------------------------------------"
    docker compose -f $COMPOSE_FILE ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    # Vérifier la santé des services
    log_info "Vérification de la santé des services"
    
    # Application
    if curl -sf http://localhost:3333/health > /dev/null 2>&1; then
        log_success "Application - Réponse OK"
    else
        log_warning "Application - Pas de réponse"
    fi
    
    # Base de données
    if docker compose -f $COMPOSE_FILE exec -T db pg_isready -U ${DB_USER:-rexel_user} > /dev/null 2>&1; then
        log_success "PostgreSQL - Connexion OK"
    else
        log_warning "PostgreSQL - Connexion échouée"
    fi
    
    # MinIO
    if curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; then
        log_success "MinIO - Service OK"
    else
        log_warning "MinIO - Service non accessible"
    fi
    
    # Redis
    if docker compose -f $COMPOSE_FILE exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis - Connexion OK"
    else
        log_warning "Redis - Connexion échouée"
    fi
}

# Afficher les logs
show_logs() {
    local service=${1:-"app"}
    local lines=${2:-50}
    
    log_info "Logs du service: $service (dernières $lines lignes)"
    echo "----------------------------------------"
    docker compose -f $COMPOSE_FILE logs --tail=$lines $service
}

# Suivre les logs en temps réel
follow_logs() {
    local service=${1:-"app"}
    
    log_info "Suivi des logs en temps réel: $service"
    log_warning "Appuyez sur Ctrl+C pour arrêter"
    echo "----------------------------------------"
    docker compose -f $COMPOSE_FILE logs -f $service
}

# Redémarrer les services
restart_services() {
    log_info "Redémarrage des services Rexel Modern"
    
    log_info "Arrêt des services..."
    docker compose -f $COMPOSE_FILE down
    
    log_info "Démarrage des services..."
    docker compose -f $COMPOSE_FILE up -d
    
    log_info "Attente du démarrage complet..."
    sleep 30
    
    log_success "Services redémarrés"
    show_status
}

# Sauvegarder la base de données
backup_database() {
    local backup_name="backup-$(date +%Y%m%d-%H%M%S).sql"
    local backup_path="./backups/$backup_name"
    
    log_info "Création d'une sauvegarde de la base de données"
    
    mkdir -p backups
    docker compose -f $COMPOSE_FILE exec -T db pg_dump -U ${DB_USER:-rexel_user} ${DB_DATABASE:-rexel_prod} > $backup_path
    
    if [ -f $backup_path ]; then
        log_success "Sauvegarde créée: $backup_path"
        log_info "Taille: $(du -h $backup_path | cut -f1)"
    else
        log_error "Erreur lors de la création de la sauvegarde"
        exit 1
    fi
}

# Afficher l'aide
show_help() {
    echo "🛠️  Rexel Modern Backend - Deployment Utilities"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commandes disponibles:"
    echo "  status              Afficher le statut des services"
    echo "  logs [service]      Afficher les logs (défaut: app)"
    echo "  follow [service]    Suivre les logs en temps réel (défaut: app)"
    echo "  restart             Redémarrer tous les services"
    echo "  backup-db           Sauvegarder la base de données"
    echo "  migrate             Exécuter les migrations"
    echo "  seed [type]         Exécuter les seeds (production|development)"
    echo "  cleanup             Nettoyer le système"
    echo "  resources           Vérifier les ressources système"
    echo "  help                Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 status                                # État des services"
    echo "  $0 logs app 100                         # 100 dernières lignes de l'app"
    echo "  $0 follow db                            # Suivre logs PostgreSQL"
    echo "  $0 seed development                     # Seeds de développement"
}

# Main
main() {
    case ${1:-help} in
        "status")
            check_deployment_directory
            show_status
            ;;
        "logs")
            check_deployment_directory
            show_logs "$2" "$3"
            ;;
        "follow")
            check_deployment_directory
            follow_logs "$2"
            ;;
        "restart")
            check_deployment_directory
            restart_services
            ;;
        "backup-db")
            check_deployment_directory
            backup_database
            ;;
        "migrate")
            check_deployment_directory
            docker compose -f $COMPOSE_FILE exec app node ace migration:run --force
            ;;
        "seed")
            check_deployment_directory
            if [ "$2" = "production" ]; then
                docker compose -f $COMPOSE_FILE exec app node ace db:seed --files="database/seeders/main_seeder.ts"
            else
                docker compose -f $COMPOSE_FILE exec app node ace db:seed
            fi
            ;;
        "cleanup")
            check_deployment_directory
            docker image prune -f
            log_success "Nettoyage terminé"
            ;;
        "resources")
            check_deployment_directory
            echo "💾 Espace disque:"
            df -h $DEPLOY_PATH
            echo "🧠 Mémoire:"
            free -h
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Commande inconnue: $1"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter le script
main "$@"
