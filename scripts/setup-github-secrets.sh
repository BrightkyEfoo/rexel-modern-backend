#!/bin/bash

# Script pour créer automatiquement les secrets GitHub à partir du fichier env.txt
# Usage: ./scripts/setup-github-secrets.sh [production|staging|both]

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENV_FILE="env.txt"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}🚀 GitHub Secrets Setup pour KesiMarket Modern${NC}"
echo "=================================="

# Vérifier que gh CLI est installé
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) n'est pas installé${NC}"
    echo "Installation: https://cli.github.com/"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Vous n'êtes pas connecté à GitHub CLI${NC}"
    echo "Connectez-vous avec: gh auth login"
    exit 1
fi

# Vérifier que le fichier env.txt existe
if [[ ! -f "$PROJECT_ROOT/$ENV_FILE" ]]; then
    echo -e "${RED}❌ Fichier $ENV_FILE non trouvé dans $PROJECT_ROOT${NC}"
    exit 1
fi

# Fonction pour vérifier si un environnement existe
check_environment_exists() {
    local env_name=$1
    
    # Note: gh CLI ne permet pas encore de lister les environnements via CLI
    # On essaie de créer un secret test pour vérifier
    if echo "test" | gh secret set "TEMP_TEST_SECRET" --env "$env_name" 2>/dev/null; then
        gh secret delete "TEMP_TEST_SECRET" --env "$env_name" 2>/dev/null
        return 0
    else
        return 1
    fi
}

# Fonction pour créer un secret
create_secret() {
    local env_name=$1
    local secret_name=$2
    local secret_value=$3
    
    if [[ -z "$secret_value" || "$secret_value" == "your-"* ]]; then
        echo -e "${YELLOW}⚠️  Valeur vide/placeholder pour $secret_name, ignoré${NC}"
        return
    fi
    
    if [[ "$env_name" == "repository" ]]; then
        echo -n "📝 Création secret (repo): $secret_name... "
        if echo "$secret_value" | gh secret set "$secret_name" 2>/dev/null; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌${NC}"
        fi
    else
        echo -n "📝 Création secret ($env_name): $secret_name... "
        if echo "$secret_value" | gh secret set "$secret_name" --env "$env_name" 2>/dev/null; then
            echo -e "${GREEN}✅${NC}"
        else
            echo -e "${RED}❌ (Vérifiez que l'environnement '$env_name' existe)${NC}"
        fi
    fi
}

# Fonction pour créer les environnements GitHub
create_github_environments() {
    echo -e "\n${BLUE}🌍 Création/Vérification des environnements GitHub${NC}"
    echo "=================================================="
    
    local environments=("production" "staging")
    
    for env in "${environments[@]}"; do
        echo -n "🔍 Vérification environnement '$env'... "
        
        if check_environment_exists "$env"; then
            echo -e "${GREEN}✅ Existe${NC}"
        else
            echo -e "${YELLOW}❌ N'existe pas${NC}"
            echo -e "${YELLOW}⚠️  IMPORTANT: Créez l'environnement '$env' manuellement sur GitHub:${NC}"
            echo "   1. Allez sur: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/environments"
            echo "   2. Cliquez 'New environment'"
            echo "   3. Nommez-le: $env"
            echo "   4. Configurez les protection rules si nécessaire"
            echo ""
        fi
    done
    
    echo ""
    read -p "Les environnements sont-ils créés ? Continuez ? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Veuillez créer les environnements GitHub d'abord."
        exit 1
    fi
}

# Fonction pour parser et créer les secrets
setup_secrets() {
    local env_name=$1
    
    echo -e "\n${BLUE}📋 Configuration des secrets pour: $env_name${NC}"
    echo "----------------------------------------"
    
    # Variables repository (communes à tous les environnements)
    if [[ "$env_name" == "repository" ]]; then
        while IFS='=' read -r key value; do
            # Ignorer les commentaires et lignes vides
            [[ $key =~ ^#.*$ ]] && continue
            [[ -z $key ]] && continue
            
            # Nettoyer la valeur
            value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"//;s/"$//')
            
            case $key in
                # Variables VPS (critiques - repository level pour accès depuis tous les workflows)
                "VPS_HOST"|"VPS_USER"|"VPS_SSH_PRIVATE_KEY")
                    create_secret "$env_name" "$key" "$value"
                    ;;
                # Variables Docker Registry (si besoin)
                "DOCKER_REGISTRY"|"DOCKER_USERNAME"|"DOCKER_PASSWORD")
                    create_secret "$env_name" "$key" "$value"
                    ;;
                # Variables de notification (communes)
                "SLACK_WEBHOOK_URL"|"DISCORD_WEBHOOK_URL")
                    create_secret "$env_name" "$key" "$value"
                    ;;
            esac
        done < "$PROJECT_ROOT/$ENV_FILE"
        return
    fi
    
    # Variables spécifiques à l'environnement (staging/production)
    while IFS='=' read -r key value; do
        # Ignorer les commentaires et lignes vides
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Nettoyer la valeur
        value=$(echo "$value" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | sed 's/^"//;s/"$//')
        
        case $key in
            # Variables d'application
            "NODE_ENV")
                if [[ "$env_name" == "production" ]]; then
                    create_secret "$env_name" "$key" "production"
                else
                    create_secret "$env_name" "$key" "staging"
                fi
                ;;
            "APP_KEY")
                if [[ "$env_name" == "production" ]]; then
                    # Pour la production, générer une clé unique ou demander
                    prod_key="${value/your-super-secret-app-key-32-characters-long/$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)}"
                    create_secret "$env_name" "$key" "$prod_key"
                else
                    staging_key="${value/your-super-secret-app-key-32-characters-long/$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)}"
                    create_secret "$env_name" "$key" "$staging_key"
                fi
                ;;
            "JWT_SECRET")
                if [[ "$env_name" == "production" ]]; then
                    prod_jwt_secret="${value/your-jwt-secret-key-here/$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)}"
                    create_secret "$env_name" "$key" "$prod_jwt_secret"
                else
                    staging_jwt_secret="${value/your-jwt-secret-key-here/$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)}"
                    create_secret "$env_name" "$key" "$staging_jwt_secret"
                fi
                ;;
            "PORT"|"HOST"|"LOG_LEVEL")
                create_secret "$env_name" "$key" "$value"
                ;;
            
            # Variables de base de données PostgreSQL
            "DB_CONNECTION")
                create_secret "$env_name" "$key" "$value"
                ;;
            "DB_HOST")
                if [[ "$env_name" == "production" ]]; then
                    # Remplacer par l'host de production
                    prod_host="${value/postgres/postgres-prod}"
                    create_secret "$env_name" "$key" "$prod_host"
                else
                    staging_host="${value/postgres/postgres-staging}"
                    create_secret "$env_name" "$key" "$staging_host"
                fi
                ;;
            "DB_PORT"|"DB_USER")
                create_secret "$env_name" "$key" "$value"
                ;;
            "DB_PASSWORD")
                if [[ "$env_name" == "production" ]]; then
                    # Générer un mot de passe sécurisé pour la production
                    prod_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$prod_password"
                else
                    # Générer un mot de passe pour staging
                    staging_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$staging_password"
                fi
                ;;
            "DB_DATABASE")
                if [[ "$env_name" == "production" ]]; then
                    prod_db="${value}_production"
                    create_secret "$env_name" "$key" "$prod_db"
                else
                    staging_db="${value}_staging"
                    create_secret "$env_name" "$key" "$staging_db"
                fi
                ;;
            
            # Variables MinIO
            "MINIO_ENDPOINT"|"MINIO_HOST")
                if [[ "$env_name" == "production" ]]; then
                    prod_minio="${value/minio/minio-prod}"
                    create_secret "$env_name" "$key" "$prod_minio"
                else
                    staging_minio="${value/minio/minio-staging}"
                    create_secret "$env_name" "$key" "$staging_minio"
                fi
                ;;
            "MINIO_PORT"|"MINIO_USE_SSL")
                create_secret "$env_name" "$key" "$value"
                ;;
            "MINIO_ROOT_USER")
                if [[ "$env_name" == "production" ]]; then
                    prod_minio_user="${value/minioadmin/kesimarket_minio_prod_$(openssl rand -hex 8)}"
                    create_secret "$env_name" "$key" "$prod_minio_user"
                else
                    staging_minio_user="${value/minioadmin/kesimarket_minio_staging_$(openssl rand -hex 8)}"
                    create_secret "$env_name" "$key" "$staging_minio_user"
                fi
                ;;
            "MINIO_ROOT_PASSWORD")
                if [[ "$env_name" == "production" ]]; then
                    prod_minio_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$prod_minio_password"
                else
                    staging_minio_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$staging_minio_password"
                fi
                ;;
            "MINIO_BROWSER_REDIRECT_URL"|"MINIO_CONSOLE_URL")
                if [[ "$env_name" == "production" ]]; then
                    prod_url="${value/localhost/minio-console.votre-domaine.com}"
                    prod_url="${prod_url/9001/443}"
                    prod_url="${prod_url/http:/https:}"
                    create_secret "$env_name" "$key" "$prod_url"
                else
                    staging_url="${value/localhost/minio-staging.votre-domaine.com}"
                    staging_url="${staging_url/9001/443}"
                    staging_url="${staging_url/http:/https:}"
                    create_secret "$env_name" "$key" "$staging_url"
                fi
                ;;
            
            # Variables Redis
            "REDIS_HOST")
                if [[ "$env_name" == "production" ]]; then
                    prod_redis="${value/redis/redis-prod}"
                    create_secret "$env_name" "$key" "$prod_redis"
                else
                    staging_redis="${value/redis/redis-staging}"
                    create_secret "$env_name" "$key" "$staging_redis"
                fi
                ;;
            "REDIS_PORT")
                create_secret "$env_name" "$key" "$value"
                ;;
            "REDIS_PASSWORD")
                if [[ "$env_name" == "production" ]]; then
                    prod_redis_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$prod_redis_password"
                else
                    staging_redis_password="$(openssl rand -base64 32 | tr -d "=+/")"
                    create_secret "$env_name" "$key" "$staging_redis_password"
                fi
                ;;
            
            # Variables de fichiers et uploads
            "MAX_FILE_SIZE"|"ALLOWED_FILE_TYPES")
                create_secret "$env_name" "$key" "$value"
                ;;
            
            # Variables CORS
            "CORS_ORIGIN")
                if [[ "$env_name" == "production" ]]; then
                    prod_origin="${value/localhost:3000/votre-domaine.com}"
                    prod_origin="${prod_origin/http:/https:}"
                    create_secret "$env_name" "$key" "$prod_origin"
                else
                    staging_origin="${value/localhost:3000/staging.votre-domaine.com}"
                    staging_origin="${staging_origin/http:/https:}"
                    create_secret "$env_name" "$key" "$staging_origin"
                fi
                ;;
            "CORS_METHODS"|"CORS_HEADERS")
                create_secret "$env_name" "$key" "$value"
                ;;
            
            # Variables Rate Limiting
            "RATE_LIMIT_REQUESTS"|"RATE_LIMIT_DURATION")
                create_secret "$env_name" "$key" "$value"
                ;;
            
            # Variables Email (si configurées)
            "SMTP_HOST"|"SMTP_PORT"|"SMTP_USERNAME"|"SMTP_PASSWORD")
                create_secret "$env_name" "$key" "$value"
                ;;
            "MAIL_FROM_ADDRESS"|"MAIL_FROM_NAME")
                if [[ "$env_name" == "production" ]]; then
                    create_secret "$env_name" "$key" "$value"
                else
                    staging_value="${value/kesimarket-modern.com/staging-kesimarket-modern.com}"
                    staging_value="${staging_value/KesiMarket Modern/KesiMarket Modern Staging}"
                    create_secret "$env_name" "$key" "$staging_value"
                fi
                ;;
        esac
    done < "$PROJECT_ROOT/$ENV_FILE"
}

# Fonction principale
main() {
    local target_env=${1:-"both"}
    
    echo -e "🎯 Mode: $target_env"
    echo -e "📁 Fichier env: $PROJECT_ROOT/$ENV_FILE"
    echo ""
    
    # Vérifier le repository
    repo_info=$(gh repo view --json nameWithOwner 2>/dev/null || echo "")
    if [[ -z "$repo_info" ]]; then
        echo -e "${RED}❌ Pas de repository GitHub détecté dans ce dossier${NC}"
        echo "Exécutez ce script depuis la racine de votre repository GitHub"
        exit 1
    fi
    
    repo_name=$(echo "$repo_info" | grep -o '"nameWithOwner":"[^"]*"' | cut -d'"' -f4)
    echo -e "📦 Repository: ${GREEN}$repo_name${NC}"
    
    # Créer/vérifier les environnements GitHub
    if [[ "$target_env" != "repository" ]]; then
        create_github_environments
    fi
    
    # Demander confirmation
    echo ""
    echo -e "${YELLOW}⚠️  Ce script va créer/mettre à jour les secrets GitHub${NC}"
    echo "Les valeurs existantes seront écrasées !"
    echo ""
    echo "Variables qui seront configurées :"
    echo "• Application: NODE_ENV, APP_KEY, JWT_SECRET, PORT, HOST"
    echo "• Base de données: DB_HOST, DB_PASSWORD, DB_DATABASE, etc."
    echo "• MinIO: MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, etc."
    echo "• Redis: REDIS_HOST, REDIS_PASSWORD"
    echo "• CORS et Rate Limiting"
    echo ""
    read -p "Continuer ? (y/N): " confirm
    
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Annulé."
        exit 0
    fi
    
    # Configurer les secrets selon le mode
    case $target_env in
        "production")
            setup_secrets "repository"
            setup_secrets "production"
            ;;
        "staging")
            setup_secrets "repository"
            setup_secrets "staging"
            ;;
        "both")
            setup_secrets "repository"
            setup_secrets "production"
            setup_secrets "staging"
            ;;
        "repository")
            setup_secrets "repository"
            ;;
        *)
            echo -e "${RED}❌ Mode invalide: $target_env${NC}"
            echo "Usage: $0 [production|staging|both|repository]"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Configuration des secrets terminée !${NC}"
    echo ""
    echo "📋 Prochaines étapes:"
    echo "1. Vérifiez les secrets sur GitHub:"
    echo "   - Repository: Settings → Secrets and variables → Actions"
    echo "   - Environments: Settings → Environments → [env] → Secrets"
    echo "2. Ajustez les URLs de production/staging si nécessaire"
    echo "3. Configurez vos services de production (PostgreSQL, MinIO, Redis)"
    echo "4. Testez un déploiement avec GitHub Actions"
    echo ""
    echo -e "${BLUE}💡 Tips:${NC}"
    echo "- 'gh secret list' pour les secrets repository"
    echo "- 'gh secret list --env staging' pour les secrets staging"
    echo "- 'gh secret list --env production' pour les secrets production"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "• Les mots de passe ont été générés automatiquement"
    echo "• Sauvegardez les valeurs générées pour vos services"
    echo "• Configurez vos domaines de production/staging"
}

# Aide
if [[ "$1" == "-h" || "$1" == "--help" ]]; then
    echo "Usage: $0 [production|staging|both|repository]"
    echo ""
    echo "Script de configuration des secrets GitHub pour KesiMarket Modern"
    echo "Configure automatiquement les variables d'environnement pour:"
    echo "• AdonisJS (APP_KEY, JWT_SECRET, NODE_ENV)"
    echo "• PostgreSQL (DB_HOST, DB_PASSWORD, DB_DATABASE)"
    echo "• MinIO (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD)"
    echo "• Redis (REDIS_HOST, REDIS_PASSWORD)"
    echo "• CORS et configuration"
    echo ""
    echo "Options:"
    echo "  production  - Créer les secrets pour la production uniquement"
    echo "  staging     - Créer les secrets pour le staging uniquement"  
    echo "  both        - Créer les secrets pour production ET staging (défaut)"
    echo "  repository  - Créer uniquement les secrets communs (repository level)"
    echo ""
    echo "Exemples:"
    echo "  $0                    # Setup complet (repository + production + staging)"
    echo "  $0 staging            # Repository + staging uniquement"
    echo "  $0 production         # Repository + production uniquement"
    echo "  $0 repository         # Secrets communs uniquement"
    exit 0
fi

# Exécuter le script
main "$@"
