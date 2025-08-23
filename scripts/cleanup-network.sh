#!/bin/bash

# 🧹 Script de Nettoyage: Réseau Docker kesimarket-net
# Nettoie et recrée le réseau partagé en cas de problème

set -e

NETWORK_NAME="kesimarket-net"

echo "🧹 Nettoyage du réseau Docker partagé..."
echo "Réseau cible: $NETWORK_NAME"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour vérifier l'accès Docker
check_docker_access() {
    if docker ps &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Déterminer si on a besoin de sudo
USE_SUDO=""
if ! check_docker_access; then
    echo -e "${YELLOW}⚠️  Docker requires sudo privileges${NC}"
    USE_SUDO="sudo "
    
    # Test sudo access
    if ! ${USE_SUDO}docker ps &> /dev/null; then
        echo -e "${RED}❌ Cannot access Docker even with sudo${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Docker is accessible without sudo${NC}"
fi

echo ""
echo -e "${BLUE}📋 État actuel des réseaux Docker:${NC}"
${USE_SUDO}docker network ls

echo ""
echo -e "${BLUE}🔍 Vérification du réseau '$NETWORK_NAME'...${NC}"

# Vérifier si le réseau existe
if ${USE_SUDO}docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}🗑️  Suppression du réseau existant '$NETWORK_NAME'...${NC}"
    
    # Arrêter les conteneurs kesimarket qui utilisent le réseau
    REXEL_CONTAINERS=$(${USE_SUDO}docker ps -q -f name=kesimarket- 2>/dev/null || true)
    if [ ! -z "$REXEL_CONTAINERS" ]; then
        echo "  Arrêt des conteneurs kesimarket..."
        ${USE_SUDO}docker stop $REXEL_CONTAINERS || echo "  Certains conteneurs étaient déjà arrêtés"
    fi
    
    if ${USE_SUDO}docker network rm "$NETWORK_NAME"; then
        echo -e "${GREEN}✅ Réseau supprimé avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la suppression - tentative de déconnexion forcée${NC}"
        ${USE_SUDO}docker network rm "$NETWORK_NAME" --force || true
    fi
else
    echo -e "${YELLOW}📝 Le réseau '$NETWORK_NAME' n'existe pas${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Création du réseau '$NETWORK_NAME'...${NC}"

if ${USE_SUDO}docker network create "$NETWORK_NAME" --driver bridge; then
    echo -e "${GREEN}✅ Réseau '$NETWORK_NAME' créé avec succès !${NC}"
    
    # Vérifier la création
    if ${USE_SUDO}docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Vérification du réseau réussie${NC}"
        ${USE_SUDO}docker network inspect "$NETWORK_NAME" --format 'Name: {{.Name}} | Driver: {{.Driver}}'
    else
        echo -e "${RED}❌ Vérification du réseau échouée${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Échec de la création du réseau${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎯 Nettoyage terminé avec succès !${NC}"
echo ""
echo -e "${BLUE}📝 Prochaines étapes:${NC}"
echo "1. Relancer le déploiement backend"
echo "2. Relancer le déploiement frontend"
echo "3. Vérifier la connectivité"

echo "" 