#!/bin/bash

# Script pour initialiser la structure des dossiers Rexel Modern Backend
# Usage: ./scripts/setup-directories.sh [base_path]

set -e

# Configuration
BASE_PATH="${1:-$HOME/rexel-modern/backend}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setup des dossiers Rexel Modern Backend"
echo "📁 Dossier de base: $BASE_PATH"
echo ""

# Création des dossiers
echo "📂 Création de la structure des dossiers..."

mkdir -p "$BASE_PATH"
mkdir -p "$BASE_PATH/backups"
mkdir -p "$BASE_PATH/images" 
mkdir -p "$BASE_PATH/uploads"
mkdir -p "$BASE_PATH/minio-data"
mkdir -p "$BASE_PATH/logs"

# Permissions
echo "🔐 Configuration des permissions..."
chmod 755 "$BASE_PATH"
chmod 755 "$BASE_PATH/backups"
chmod 755 "$BASE_PATH/images"
chmod 755 "$BASE_PATH/uploads"
chmod 755 "$BASE_PATH/minio-data"
chmod 755 "$BASE_PATH/logs"

# Fichiers de log initiaux
echo "📝 Création des fichiers de logs..."
touch "$BASE_PATH/logs/access.log"
chmod 644 "$BASE_PATH/logs/access.log"

# Fichier .gitkeep pour les dossiers vides
echo "📌 Ajout des fichiers .gitkeep..."
echo "# Dossier pour les sauvegardes de base de données" > "$BASE_PATH/backups/.gitkeep"
echo "# Dossier pour les images Docker sauvegardées" > "$BASE_PATH/images/.gitkeep"
echo "# Dossier pour les uploads de l'application" > "$BASE_PATH/uploads/.gitkeep"
echo "# Dossier pour les données MinIO" > "$BASE_PATH/minio-data/.gitkeep"

# Résumé
echo ""
echo "✅ Structure des dossiers créée avec succès !"
echo ""
echo "📋 Structure créée :"
echo "   $BASE_PATH/"
echo "   ├── backups/        # Sauvegardes DB"
echo "   ├── images/         # Images Docker"
echo "   ├── uploads/        # Fichiers application"
echo "   ├── minio-data/     # Stockage MinIO"
echo "   └── logs/           # Logs Caddy"
echo "       └── access.log  # Log d'accès"
echo ""
echo "🔗 Prochaines étapes :"
echo "   1. Copier docker-compose.prod.yml dans $BASE_PATH/"
echo "   2. Copier Caddyfile dans $BASE_PATH/"
echo "   3. Configurer les variables d'environnement"
echo "   4. Lancer le déploiement"
echo ""
echo "💡 Pour lancer le déploiement :"
echo "   cd $BASE_PATH"
echo "   docker compose -f docker-compose.prod.yml up -d" 