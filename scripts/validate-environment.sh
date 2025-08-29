#!/bin/bash

# 🔍 Script de Validation: Configuration Environnement Backend
# Valide que toutes les variables d'environnement requises sont définies

set -e

echo "🚀 Validation de la configuration Backend KesiMarket Modern..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if variable is set
check_var() {
    local var_name="$1"
    local var_value="${!var_name}"
    local is_optional="$2"
    
    if [ -z "$var_value" ]; then
        if [ "$is_optional" = "optional" ]; then
            echo -e "⚠️  ${YELLOW}$var_name${NC} - Non définie (optionnel)"
        else
            echo -e "❌ ${RED}$var_name${NC} - MANQUANTE (requis)"
            return 1
        fi
    else
        echo -e "✅ ${GREEN}$var_name${NC} - Définie"
    fi
    return 0
}

# Load .env file if exists
if [ -f ".env" ]; then
    echo -e "${BLUE}📁 Chargement du fichier .env...${NC}"
    source .env
else
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé - vérification des variables système${NC}"
fi

echo ""
echo "🔍 Vérification des variables d'environnement requises..."
echo "--------------------------------------------------------"

MISSING_VARS=0

# Database Variables
echo -e "${BLUE}📊 Base de données PostgreSQL:${NC}"
check_var "DB_USER" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "DB_PASSWORD" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "DB_DATABASE" || MISSING_VARS=$((MISSING_VARS + 1))

echo ""

# MinIO Variables
echo -e "${BLUE}📦 MinIO Object Storage:${NC}"
check_var "MINIO_ACCESS_KEY" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "MINIO_SECRET_KEY" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "MINIO_BUCKET" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "MINIO_PUBLIC_ENDPOINT" || MISSING_VARS=$((MISSING_VARS + 1))

echo ""

# Redis Variables
echo -e "${BLUE}⚡ Redis Cache:${NC}"
check_var "REDIS_PASSWORD" || MISSING_VARS=$((MISSING_VARS + 1))

echo ""

# Application Variables
echo -e "${BLUE}🔐 Application Security:${NC}"
check_var "APP_KEY" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "JWT_SECRET" || MISSING_VARS=$((MISSING_VARS + 1))

echo ""

# CORS and Frontend
echo -e "${BLUE}🌐 CORS et Frontend:${NC}"
check_var "CORS_ORIGINS" || MISSING_VARS=$((MISSING_VARS + 1))
check_var "FRONTEND_URL" || MISSING_VARS=$((MISSING_VARS + 1))

echo ""

# Optional Email Variables
echo -e "${BLUE}📧 Email (Optionnel):${NC}"
check_var "SMTP_HOST" "optional"
check_var "SMTP_PORT" "optional"
check_var "SMTP_USERNAME" "optional"
check_var "SMTP_PASSWORD" "optional"
check_var "SMTP_FROM" "optional"
check_var "MAIL_USERNAME" "optional"
check_var "GOOGLE_APP_SECRET" "optional"

echo ""
echo "📋 Validation de la configuration interne Docker..."
echo "---------------------------------------------------"

# Check internal Docker configuration
if [ "${DB_HOST}" = "db" ]; then
    echo -e "✅ ${GREEN}DB_HOST${NC} - Correctement configuré pour Docker interne (db)"
else
    echo -e "⚠️  ${YELLOW}DB_HOST${NC} - Devrait être 'db' pour Docker interne, trouvé: '${DB_HOST}'"
fi

if [ "${MINIO_HOST}" = "minio" ]; then
    echo -e "✅ ${GREEN}MINIO_HOST${NC} - Correctement configuré pour Docker interne (minio)"
else
    echo -e "⚠️  ${YELLOW}MINIO_HOST${NC} - Devrait être 'minio' pour Docker interne, trouvé: '${MINIO_HOST}'"
fi

if [ "${REDIS_HOST}" = "redis" ]; then
    echo -e "✅ ${GREEN}REDIS_HOST${NC} - Correctement configuré pour Docker interne (redis)"
else
    echo -e "⚠️  ${YELLOW}REDIS_HOST${NC} - Devrait être 'redis' pour Docker interne, trouvé: '${REDIS_HOST}'"
fi

echo ""
echo "🐳 Vérification de Docker et réseau..."
echo "--------------------------------------"

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo -e "✅ ${GREEN}Docker${NC} - Installé"
    
    # Check if kesimarket-net network exists
    if docker network ls | grep -q "kesimarket-net"; then
        echo -e "✅ ${GREEN}Réseau kesimarket-net${NC} - Existe"
    else
        echo -e "⚠️  ${YELLOW}Réseau kesimarket-net${NC} - Manquant (sera créé automatiquement)"
    fi
else
    echo -e "❌ ${RED}Docker${NC} - Non installé ou non accessible"
fi

echo ""
echo "=================================================="
echo "🎯 Résumé de la validation"
echo "=================================================="

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "🎉 ${GREEN}Configuration VALIDE !${NC}"
    echo -e "✅ Toutes les variables requises sont définies"
    echo -e "🚀 Le déploiement devrait fonctionner correctement"
else
    echo -e "🚨 ${RED}Configuration INCOMPLÈTE !${NC}"
    echo -e "❌ $MISSING_VARS variable(s) requise(s) manquante(s)"
    echo ""
    echo -e "${YELLOW}📝 Actions requises:${NC}"
    echo "1. Configurer les variables manquantes dans GitHub Secrets"
    echo "2. Ou créer un fichier .env local avec toutes les variables"
    echo "3. Relancer ce script pour vérifier"
fi

echo ""
echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo "- GitHub Secrets: https://github.com/your-org/kesimarket-modern-backend/settings/secrets/actions"
echo "- Documentation: ./DEPLOYMENT.md"
echo "- Dépannage: ../kesimarket-modern/DEPLOYMENT-SHARED.md"

echo "" 