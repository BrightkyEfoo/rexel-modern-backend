#!/bin/bash

# Script de dépannage Docker pour KesiMarket Modern Backend
# Usage: ./fix-docker-permissions.sh

set -e

echo "🔧 KesiMarket Modern - Docker Permissions Fix Script"
echo "=============================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Vérifier si l'utilisateur est root
if [ "$EUID" -eq 0 ]; then
    print_warning "Ce script ne doit PAS être exécuté en tant que root."
    print_info "Exécutez-le avec votre utilisateur normal."
    exit 1
fi

echo
print_info "Utilisateur actuel: $(whoami)"
print_info "Groupes actuels: $(groups)"
echo

# 1. Vérifier si Docker est installé
echo "📦 Vérification de l'installation Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker n'est pas installé. Installation en cours..."
    
    # Installation Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    print_success "Docker installé avec succès"
else
    print_success "Docker est déjà installé: $(docker --version 2>/dev/null || echo 'Version non accessible')"
fi

# 2. Vérifier le service Docker
echo
echo "🚀 Vérification du service Docker..."
if ! sudo systemctl is-active --quiet docker; then
    print_warning "Service Docker arrêté. Démarrage en cours..."
    sudo systemctl start docker
    sudo systemctl enable docker
    print_success "Service Docker démarré et activé"
else
    print_success "Service Docker est actif"
fi

# 3. Vérifier le groupe docker
echo
echo "👥 Vérification du groupe docker..."
if ! groups | grep -q '\bdocker\b'; then
    print_warning "Utilisateur pas dans le groupe docker. Ajout en cours..."
    sudo usermod -aG docker $USER
    print_success "Utilisateur ajouté au groupe docker"
    print_warning "IMPORTANT: Vous devez vous reconnecter pour que les changements prennent effet"
    print_info "Utilisez: logout puis reconnectez-vous via SSH"
else
    print_success "Utilisateur déjà dans le groupe docker"
fi

# 4. Installation Docker Compose si nécessaire
echo
echo "🔧 Vérification de Docker Compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    print_warning "Docker Compose non trouvé. Installation en cours..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installé"
else
    print_success "Docker Compose est disponible"
fi

# 5. Test d'accès Docker
echo
echo "🧪 Test d'accès Docker..."
if docker ps &> /dev/null; then
    print_success "Accès Docker fonctionnel sans sudo!"
    
    # Afficher les conteneurs en cours
    echo
    print_info "Conteneurs Docker actuels:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
elif sudo docker ps &> /dev/null; then
    print_warning "Docker fonctionne mais nécessite sudo"
    print_info "Cela peut être normal si vous venez d'être ajouté au groupe docker"
    print_info "Reconnectez-vous via SSH pour activer les nouvelles permissions de groupe"
    
    echo
    print_info "Conteneurs Docker actuels (avec sudo):"
    sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
else
    print_error "Docker n'est pas accessible même avec sudo"
    print_info "Vérifiez les logs: sudo journalctl -u docker.service"
    exit 1
fi

# 6. Vérifier les permissions du socket Docker
echo
echo "🔐 Vérification des permissions du socket Docker..."
ls -la /var/run/docker.sock
SOCKET_GROUP=$(stat -c '%G' /var/run/docker.sock)
print_info "Groupe propriétaire du socket: $SOCKET_GROUP"

if [ "$SOCKET_GROUP" != "docker" ]; then
    print_warning "Le socket Docker n'appartient pas au groupe docker"
    print_info "Ceci peut nécessiter une intervention manuelle"
fi

# 7. Créer un réseau Docker pour le projet si nécessaire
echo
echo "🌐 Vérification du réseau Docker kesimarket-network..."
if docker network ls 2>/dev/null | grep -q kesimarket-network || sudo docker network ls 2>/dev/null | grep -q kesimarket-network; then
    print_success "Le réseau kesimarket-network existe déjà"
else
    print_info "Création du réseau kesimarket-network..."
    if docker network create kesimarket-network 2>/dev/null || sudo docker network create kesimarket-network 2>/dev/null; then
        print_success "Réseau kesimarket-network créé"
    else
        print_warning "Impossible de créer le réseau (normal si pas de permissions)"
    fi
fi

# 8. Résumé et prochaines étapes
echo
echo "📋 RÉSUMÉ ET PROCHAINES ÉTAPES"
echo "=============================="

if docker ps &> /dev/null; then
    print_success "Docker est complètement fonctionnel!"
    echo
    print_info "Vous pouvez maintenant:"
    echo "  1. Relancer le workflow GitHub Actions"
    echo "  2. Ou déployer manuellement avec:"
    echo "     cd ~/kesimarket-modern/backend"
    echo "     docker compose -f docker-compose.prod.yml up -d"
else
    print_warning "Docker nécessite encore sudo ou une reconnexion"
    echo
    print_info "Actions recommandées:"
    echo "  1. RECONNECTEZ-VOUS via SSH: logout puis ssh user@server"
    echo "  2. Testez à nouveau: docker ps"
    echo "  3. Si ça fonctionne, relancez le deployment GitHub"
    echo
    print_info "Si le problème persiste après reconnexion:"
    echo "  1. Vérifiez: sudo journalctl -u docker.service"
    echo "  2. Redémarrez Docker: sudo systemctl restart docker"
    echo "  3. Contactez l'administrateur système si nécessaire"
fi

echo
print_success "Script terminé! 🎉" 